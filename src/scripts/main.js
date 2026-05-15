function generateUser() {
    return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
}

const data = {
    websocket: null,
    username: generateUser(), // todo: oauth
    endpoint: window.location.href,
    newMessage: '',
    chat: { messages: [] },
    logs: [],
    loggedin: false,
    connected: false,
    counter: 0
};
const app = new Vue({
    el: '#app',
    data: data,
    methods: {
        login: function () {
            if (this.username) {
                this.loggedin = true;

                this.log("Connecting...");

                axios.get("/api/tableStorage?tableName=Akashic&partitionKey=log")
                .then(resp => {
                    $.each(resp.data.reverse(),function(i,e){
                        app.addMessageToView(JSON.stringify(e))
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
                        this.sendToServer(`${this.username} is awake`);
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
        }
    }
});
