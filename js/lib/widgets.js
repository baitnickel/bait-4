export class Navigator {
    constructor(length, displayFunction) {
        this.index = 0;
        this.length = length;
        this.displayFunction = displayFunction;
        this.firstButton = document.createElement("button");
        this.previousButton = document.createElement("button");
        this.nextButton = document.createElement("button");
        this.lastButton = document.createElement("button");
        if (this.length > 1) {
            this.firstButton.disabled = true;
            this.previousButton.disabled = true;
            this.firstButton.addEventListener('click', () => {
                this.index = 0;
                this.firstButton.disabled = true;
                this.previousButton.disabled = true;
                this.lastButton.disabled = false;
                this.nextButton.disabled = false;
                this.displayFunction(this.index);
            });
            this.previousButton.addEventListener('click', () => {
                if (this.index > 0) {
                    this.index -= 1;
                    if (this.index == 0) {
                        this.firstButton.disabled = true;
                        this.previousButton.disabled = true;
                    }
                    this.lastButton.disabled = false;
                    this.nextButton.disabled = false;
                    this.displayFunction(this.index);
                }
            });
            this.nextButton.addEventListener('click', () => {
                if (this.index < this.length - 1) {
                    this.index += 1;
                    this.firstButton.disabled = false;
                    this.previousButton.disabled = false;
                    if (this.index == this.length - 1) {
                        this.lastButton.disabled = true;
                        this.nextButton.disabled = true;
                    }
                    this.displayFunction(this.index);
                }
            });
            this.lastButton.addEventListener('click', () => {
                if (this.index < this.length - 1) {
                    this.index = this.length - 1;
                    this.firstButton.disabled = false;
                    this.previousButton.disabled = false;
                    this.lastButton.disabled = true;
                    this.nextButton.disabled = true;
                    this.displayFunction(this.index);
                }
            });
        }
    }
}
