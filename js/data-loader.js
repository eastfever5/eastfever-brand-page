class DataLoader {
    constructor() {
        this.data = null;
    }

    async load() {
        try {
            const dataUrl = `${window.location.origin}/data/data.json?v=${new Date().getTime()}`;
            const response = await fetch(dataUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.data = await response.json();
            return this.data;
        } catch (error) {
            console.error('Failed to load data:', error);
            try {
                // Fallback: try relative path if absolute origin fetch fails
                const relResponse = await fetch('../data/data.json?v=' + new Date().getTime());
                if (relResponse.ok) {
                    this.data = await relResponse.json();
                    return this.data;
                }
            } catch (relError) {
                console.error('Fallback failed:', relError);
            }
            return null;
        }
    }

    getData() {
        return this.data;
    }
}

window.dataLoader = new DataLoader();
