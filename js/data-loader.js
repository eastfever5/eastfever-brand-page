class DataLoader {
    constructor() {
        this.data = null;
    }

    async load() {
        try {
            const response = await fetch('data/data.json');
            this.data = await response.json();
            return this.data;
        } catch (error) {
            console.error('Failed to load data:', error);
            return null;
        }
    }

    getData() {
        return this.data;
    }
}

window.dataLoader = new DataLoader();
