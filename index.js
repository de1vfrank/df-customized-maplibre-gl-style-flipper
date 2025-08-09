// Define the StyleFlipperControl class
class StyleFlipperControl {
  constructor(styles, onStyleChange) {
    this.styles = styles;
    this.onStyleChange = onStyleChange;
    this.buttons = {};
    this.currentStyleCode = null;
    this.customSourcesAndLayers = {};
  }

  onAdd(map) {
    this.map = map;

    // Create the control container
    this.container = document.createElement("div");
    this.container.className =
      "maplibregl-ctrl maplibregl-ctrl-group style-flipper-control";

    // Add a button for each style
    for (const [styleClass, styleData] of Object.entries(this.styles)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `btnflipper ${styleClass}`;
      button.innerText = styleData.name

      // Add a click event listener
      button.addEventListener("click", () => {
        this.changeStyle(styleClass);
      });

      this.container.appendChild(button);
      this.buttons[styleClass] = button;
    }

    // Highlight the current style
    this.highlightActiveStyle(this.getCurrentStyleClass());

    return this.container;
  }

  onRemove() {
    this.container.parentNode.removeChild(this.container);
    this.map = undefined;
  }

  highlightActiveStyle(activeStyleClass) {
    Object.values(this.buttons).forEach((button) => {
      button.classList.remove("active");
    });
    if (activeStyleClass && this.buttons[activeStyleClass]) {
      this.buttons[activeStyleClass].classList.add("active");
    }
  }

  getCurrentStyleClass() {
    if (!this.currentStyleCode) {
      return null;
    }
    for (const [styleClass, styleData] of Object.entries(this.styles)) {
      if (styleData.code === this.currentStyleCode) {
        return styleClass;
      }
    }
    return null;
  }

  setCurrentStyleCode(code) {
    this.currentStyleCode = code;
    this.highlightActiveStyle(this.getCurrentStyleClass());
  }

  saveCustomSourcesAndLayers() {
    this.customSourcesAndLayers = {
      sources: {},
      layers: [],
      image: {}
    };
    const sources = this.map.getStyle().sources;
    for (const [sourceId, source] of Object.entries(sources)) {
      if (!source.url) {
        this.customSourcesAndLayers.sources[sourceId] = source;
      }
    }
    const layers = this.map.getStyle().layers;
    for (const layer of layers) {
      if (this.customSourcesAndLayers.sources[layer.source]) {
        this.customSourcesAndLayers.layers.push(layer);
      }
    }

    const allImageIDs = this.map.listImages();
    const customIDs = allImageIDs.filter(id => id.startsWith('customImg-'));
    if(customIDs.length !== 0 ) {
        customIDs.forEach((Id)=>{
            this.customSourcesAndLayers.image[Id] = this.map.getImage(Id);
        });
    }
  }

  restoreCustomSourcesAndLayers() {
    for (const [sourceId, source] of Object.entries(
      this.customSourcesAndLayers.sources
    )) {
      this.map.addSource(sourceId, source);
    }
    for (const layer of this.customSourcesAndLayers.layers) {
      this.map.addLayer(layer);
    }

    for (const [IdImage, Image] of Object.entries(
      this.customSourcesAndLayers.image
    )) {
      this.map.addImage(IdImage, Image.data);
    }
  }

  // เมธอดใหม่สำหรับเปลี่ยนสไตล์จากภายนอก
  changeStyle(styleClass) {
    const styleData = this.styles[styleClass];
    if (!styleData) {
      console.warn(`Style "${styleClass}" not found.`);
      return;
    }

    this.saveCustomSourcesAndLayers();
    this.map.setStyle(styleData.url);
    this.currentStyleCode = styleData.code;
    this.highlightActiveStyle(styleClass);

    this.map.once("styledata", () => {
      this.restoreCustomSourcesAndLayers();
    });

    if (this.onStyleChange) {
      this.onStyleChange(styleClass, styleData.code);
    }
  }
}

// Add CSS for the control
const style = document.createElement("style");
style.textContent = `
  .style-flipper-control {
    display: flex;
    align-items: center;
    width: 100% !important;
    padding: 0px;
    border-radius: 0px;
  }

  .style-flipper-control .btnflipper {
    height: 20px;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: black;
    width: 100%;
    font-size: 12px !important;
    padding: 0 !important;
    margin: 0 !important;
    border-radius: 0px;
  }

  .style-flipper-control .btnflipper.active {
   background-color: black;
   color: white;
  }

`;
document.head.appendChild(style);

export default StyleFlipperControl;
