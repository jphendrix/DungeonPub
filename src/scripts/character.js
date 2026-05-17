const Character = {
    default() {
        return {
            name: '',
            race: '',
            class: '',
            level: 1,
            hp: { current: 0, max: 0 },
            stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
            status: ''
        };
    },

    load(endpoint, name) {
        return axios.get(`${endpoint}api/tableStorage?tableName=Akashic&partitionKey=characters&id=${name}`)
            .then(resp => {
                if (resp.data.length > 0 && resp.data[0].data) {
                    return JSON.parse(resp.data[0].data);
                }
                return Character.default();
            });
    },

    save(endpoint, name, character) {
        return axios.post(`${endpoint}api/tableStorage?tableName=Akashic&partitionKey=characters`, {
            id: name,
            data:JSON.stringify(character),
        });
    }
};