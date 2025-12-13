// Declare global angular variable
declare const angular: any;

// Toolbar component module
const toolbarModule = angular.module('toolbarModule', []);

// Toolbar component controller
export class ToolbarController {
  // Output callbacks
  onCrop!: () => void;
  onFlip!: () => void;
  onRotate!: () => void;
  onDraw!: () => void;
  onShape!: () => void;
  onText!: () => void;
  onFilter!: () => void;
  onUndo!: () => void;
  onRedo!: () => void;
  onAI!: () => void;
  
  constructor() {}
  
  // Crop button click handler
  onCropClick() {
    if (this.onCrop) {
      this.onCrop();
    }
  }
  
  // Flip button click handler
  onFlipClick() {
    if (this.onFlip) {
      this.onFlip();
    }
  }
  
  // Rotate button click handler
  onRotateClick() {
    if (this.onRotate) {
      this.onRotate();
    }
  }
  
  // Draw button click handler
  onDrawClick() {
    if (this.onDraw) {
      this.onDraw();
    }
  }
  
  // Shape button click handler
  onShapeClick() {
    if (this.onShape) {
      this.onShape();
    }
  }
  
  // Text button click handler
  onTextClick() {
    if (this.onText) {
      this.onText();
    }
  }
  
  // Filter button click handler
  onFilterClick() {
    if (this.onFilter) {
      this.onFilter();
    }
  }
  
  // Undo button click handler
  onUndoClick() {
    if (this.onUndo) {
      this.onUndo();
    }
  }
  
  // Redo button click handler
  onRedoClick() {
    if (this.onRedo) {
      this.onRedo();
    }
  }
  
  // AI button click handler
  onAIClick() {
    if (this.onAI) {
      this.onAI();
    }
  }
}

// Toolbar directive
export const ToolbarDirective = {
  restrict: 'E',
  scope: {
    onCrop: '&',
    onFlip: '&',
    onRotate: '&',
    onDraw: '&',
    onShape: '&',
    onText: '&',
    onFilter: '&',
    onUndo: '&',
    onRedo: '&',
    onAI: '&'
  },
  templateUrl: '/src/image-editor/toolbar/toolbar.html',
  controller: ToolbarController,
  controllerAs: 'vm',
  bindToController: true
};

// Register directive and controller
toolbarModule.directive('toolbar', () => ToolbarDirective);
toolbarModule.controller('ToolbarController', ToolbarController);

export default toolbarModule;