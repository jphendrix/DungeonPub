const Character = {
    default() {
        return {
                name: 'Pippen',
                race: 'Halfling',
                class: 'Rogue',
                level: 5,
                hp: { "current": 28, "max": 34 },
                stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
                status: "Sword broken. Unarmed.",
                inventory: ["Dagger", "Thieves tools", "50gp"],
                notes: "Has a grudge against the bandit leader"
        };
    },

    //TODO: after auth, only pull this user's character, and save to their record on the server
    load(endpoint, name) {
        if((name||'') != '') {
            return axios.get(`${endpoint}api/character/${name}`)
                .then(resp => {
                    if (resp.data && resp.data.data) {
                        return JSON.parse(resp.data.data);
                    }
                    return Character.default();
                })
                .catch(err => {
                    return Character.default();
                });
        } else {
            return Promise.resolve(Character.default());
        }
    },

    //TODO: after auth, only allow saving to this user's record on the server
    save(endpoint, name, character) {
        return axios.post(`${endpoint}api/character/${name}`, {
            data:JSON.stringify(character),
        });
    }
};

const Campaign = {
    default(){
        return {
            campaignName: "The Shadow of the Swamp",
            sessionNumber: 3,
            party:{
                members: ["Pippen", "Gandalf"],
                formation: "Pippen scouts ahead",
                groupInventory: ["Rope 50ft", "Lantern", "Camp supplies"],
                partyGold: 120,
                morale: "Shaken after Pippen's sword broke",
                currentObjective: "Find a blacksmith before heading south"
                },
            currentDate: {
                realWorld: (new Date()).toISOString(),
                inGame: "The 14th day of the Harvest Moon, Year 412"
            },
            currentLocation: {
                name: "Millhaven",
                type: "village",
                region: "The Fenlands",
                description: "A small, fog-drenched village on the edge of Swamp Road. Known for its peat fires and suspicious locals."
            },
            weather: "Heavy fog, light rain",
            timeOfDay: "Evening",
            activeThreat: "Bandit activity on Swamp Road"
        };
    },

    save(endpoint, campaign) {
        return axios.post(`${endpoint}api/campaign`, {
            data:JSON.stringify(campaign),
        });
    },

    load(endpoint) {
        return axios.get(`${endpoint}api/campaign`)
            .then(resp => {
                if (resp.data && resp.data.data) {
                    return JSON.parse(resp.data.data);
                }
                return Campaign.default();
            });
    }   
};
