const data = {
    websocket: null,
    username: '', // todo: oauth
    endpoint: window.location.href,
    newMessage: '',
    chat: { messages: [] },
    logs: [],
    loggedin: false,
    connected: false,
    counter: 0,

    character: Character.default(),
    campaign: Campaign.default()
};


const app = new Vue({
    el: '#app',
    data: data,
    computed: {
        inventoryCsv: {
            get() {
                return (this.character.inventory||[]).join(", ");
            },

            set(value) {
                this.character.inventory = value
                    .split(",")
                    .map(x => x.trim())
                    .filter(x => x.length > 0);
            }
        },
        partyCsv:{
            get() {
                return (this.campaign.party.members||[]).join(", ");
            },

            set(value) {
                this.campaign.party.members = value
                    .split(",")
                    .map(x => x.trim())
                    .filter(x => x.length > 0);         
            }
        },
        partyInventoryCsv: {
            get() {
                return (this.campaign.party.groupInventory||[]).join(", ");
            },

            set(value) {
                this.campaign.party.groupInventory = value
                    .split(",")
                    .map(x => x.trim())
                    .filter(x => x.length > 0);         
            }
        }
    },
    mounted() {
        console.log("App mounted.");
    },
    created() {
        console.log("App created, loading character...");
    },    
    methods: {
        login: function () {
            if (this.username) {
                this.loggedin = true;

                Character.load(this.endpoint, this.username)
                    .then(c => this.character = c)
                    .catch(err => {
                        this.log("Error loading character: " + err); 
                    });

                Campaign.load(this.endpoint)
                    .then(c => this.campaign = c)
                    .catch(err => {
                        this.log("Error loading campaign: " + err);
                    });

                this.log("Connecting...");

                axios.get("/api/tableStorage?tableName=Akashic&partitionKey=log")
                .then(resp => {
                    resp.data
                        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                        .forEach(e => {
                            app.addMessageToView(JSON.stringify(e));
                        });
                });

                axios.post(`${this.endpoint}api/login?userid=${this.username}`, null, null)
                .then(resp => resp.data)
                .then(info => {
                    return info.url;
                }).catch(alert)
                .then(url => {
                    var websocket = this.websocket = new WebSocket(url);
                    websocket.onopen = e => {
                        this.connected = true;
                        console.log(websocket.protocol);
                        this.log("Client websocket opened.");
                    }
                    websocket.onclose = e => {
                        this.connected = false;
                        this.log("Client websocket closed.");
                    }
                    websocket.onerror = e => {
                        this.log("Client websocket error, check the Console window for details.");
                    }
                    websocket.onmessage = e => {
                        if (!e.data) return;
                        this.addMessageToView(e.data);
                    }}).catch(err => {
                        this.log("Error: " + err);
                });
            }
        },
        sendNewMessage: function () {
            if (!this.newMessage) {
                this.log("Error: empty message");
                return;
            }

            this.sendToServer(this.newMessage);

            this.newMessage = '';
        },
        addItem(item, owner) {
            item.id = this.counter++; // vue transitions need an id
            owner.push(item);
        },
        sendToServer(content) {
            let payload = {
                id:new Date().toISOString().replace(/:/g, '-'),
                from:this.username,
                content:content
            }

            //log
            axios.post(`${this.endpoint}/api/tableStorage?tableName=Akashic&partitionKey=log`, payload);
            
            //share
            this.websocket.send(JSON.stringify(payload));
        },
        addMessageToView(message) {
            this.addItem(JSON.parse(message), this.chat.messages);

            var elem = document.getElementById('chat');
            if (elem) {
                elem.scrollTop = elem.scrollHeight;
            }
        },
        log(content) {
            this.addItem(new Date().toLocaleString() + ": " + content, this.logs);
        },

        saveCharacter() {
            console.log("Saving character...");
            Character.save(this.endpoint, this.username, this.character)
                .then(() => this.log("Character saved."))
                .catch(() => this.log("Error saving character."));
        },
        saveCampaign() {
            console.log("Saving campaign...");
            Campaign.save(this.endpoint, this.campaign)
                .then(() => this.log("Campaign saved."))
                .catch(() => this.log("Error saving campaign."));
        }
    }
});
