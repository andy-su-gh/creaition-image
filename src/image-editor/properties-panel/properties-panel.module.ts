// Declare global angular variable
declare const angular: any;

// Properties Panel component module
const propertiesPanelModule = angular.module('propertiesPanelModule', []);

// Properties Panel component controller
export class PropertiesPanelController {
  // Inputs
  activeTool!: string;
  showPanel!: boolean;
  
  // Output callbacks
  onClose!: () => void;
  onApply!: (properties: any) => void;
  onCancel!: () => void;
  
  // Crop properties
  cropWidth: number = 0;
  cropHeight: number = 0;
  cropRatio: string = '';
  
  // Draw properties
  drawColor: string = '#000000';
  drawWidth: number = 5;
  
  // Text properties
  textContent: string = '';
  textSize: number = 24;
  textColor: string = '#000000';
  
  constructor() {}
  
  // Close button click handler
  onCloseClick() {
    if (this.onClose) {
      this.onClose();
    }
  }
  
  // Overlay click handler
  onOverlayClick() {
    if (this.onClose) {
      this.onClose();
    }
  }
  
  // Apply button click handler
  onApplyClick() {
    if (this.onApply) {
      const properties = this.getCurrentProperties();
      this.onApply(properties);
    }
  }
  
  // Cancel button click handler
  onCancelClick() {
    if (this.onCancel) {
      this.onCancel();
    }
  }
  
  // Apply filter click handler
  applyFilter(filterName: string) {
    if (this.onApply) {
      this.onApply({ filter: filterName });
    }
  }
  
  // Get current properties based on active tool
  getCurrentProperties() {
    const properties: any = { tool: this.activeTool };
    
    switch (this.activeTool) {
      case 'crop':
        properties.crop = {
          width: this.cropWidth,
          height: this.cropHeight,
          ratio: this.cropRatio
        };
        break;
      case 'draw':
        properties.draw = {
          color: this.drawColor,
          width: this.drawWidth
        };
        break;
      case 'text':
        properties.text = {
          content: this.textContent,
          size: this.textSize,
          color: this.textColor
        };
        break;
    }
    
    return properties;
  }
}

// Properties Panel directive
export const PropertiesPanelDirective = {
  restrict: 'E',
  scope: {
    activeTool: '=',
    showPanel: '=',
    onClose: '&',
    onApply: '&',
    onCancel: '&'
  },
  templateUrl: '/src/image-editor/properties-panel/properties-panel.html',
  controller: PropertiesPanelController,
  controllerAs: 'vm',
  bindToController: true
};

// Register directive and controller
propertiesPanelModule.directive('propertiesPanel', () => PropertiesPanelDirective);
propertiesPanelModule.controller('PropertiesPanelController', PropertiesPanelController);

export default propertiesPanelModule;