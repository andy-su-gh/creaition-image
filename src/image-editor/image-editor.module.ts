// Declare global angular variable
declare const angular: any;

// Import submodules
import './toolbar/toolbar.module';
import './properties-panel/properties-panel.module';
import './ai-panel/ai-panel.module';

// ImageEditor component module
const imageEditorModule = angular.module('imageEditorModule', ['toolbarModule', 'propertiesPanelModule', 'aiPanelModule']);

// Image editor controller
export class ImageEditorController {
  // Image editor instance
  private imageEditor: any = null;
  
  // Image URL input
  imageUrl: string = '';
  
  // Toolbar and Properties Panel state
  activeTool: string = '';
  showPropertiesPanel: boolean = false;
  showAIPanel: boolean = false;

  // No dependencies needed for mock implementation
  constructor() {
    // Simplified constructor for mock implementation
  }
  
  $onInit() {
    // Only initialize editor if imageUrl is provided
    if (this.imageUrl) {
      this.initializeEditor(this.imageUrl);
    }
  }
  
  $onChanges(changes: any) {
    // Re-initialize editor if imageUrl changes
    if (changes.imageUrl && changes.imageUrl.currentValue) {
      this.initializeEditor(changes.imageUrl.currentValue);
    }
  }
  
  $onDestroy() {
    if (this.imageEditor) {
      this.imageEditor.destroy();
      this.imageEditor = null;
    }
  }
  
  private initializeEditor(imageUrl: string) {
    const container = document.getElementById('image-editor-container');
    if (!container) return;
    
    // Destroy existing editor instance if it exists
    if (this.imageEditor) {
      this.imageEditor.destroy();
      this.imageEditor = null;
    }
    
    // Import ImageEditor dynamically since it's loaded from npm
    import('tui-image-editor').then(ImageEditorModule => {
      const ImageEditor = ImageEditorModule.default;
      
      this.imageEditor = new ImageEditor(container, {
        includeUI: {
          loadImage: {
            path: imageUrl,
            name: '编辑图像'
          },
          theme: {
            // // Menu Bar
            // 'menu.normalIcon.color': '#00ff00',
            // 'menu.activeIcon.color': '#000000',
            // 'menu.disabledIcon.color': '#bebebe',
            // 'menu.hoverIcon.color': '#ffffff',
            // 'menu.label.color': '#000000',
            // 'menu.backgroundColor': '#ffffff',
            // 'menu.border': '1px solid #efefee',
            // 'menu.activeBackgroundColor': '#ffffff',
            // 'menu.hoverBackgroundColor': '#f5f5f5',
            // 'menu.disabledBackgroundColor': '#ffffff',
            
            // // Submenu
            // 'submenu.normalIcon.color': '#000000',
            // 'submenu.activeIcon.color': '#000000',
            // 'submenu.label.color': '#000000',
            // // 'submenu.backgroundColor': '#00ffff',
            // 'submenu.border': '1px solid #efefee',
            
            // // Buttons
            // 'button.normal.color': '#000000',
            // 'button.normal.border': '1px solid #bebebe',
            // 'button.normal.backgroundColor': '#ffffff',
            // 'button.hover.color': '#000000',
            // 'button.hover.border': '1px solid #000000',
            // 'button.hover.backgroundColor': '#ffffff',
            // 'button.active.color': '#000000',
            // 'button.active.border': '1px solid #000000',
            // 'button.active.backgroundColor': '#ffffff',
            
            // // Inputs
            // 'input.border': '1px solid #bebebe',
            // 'input.backgroundColor': '#ffffff',
            // 'input.color': '#000000',
            
            // // Others
            // 'title.color': '#000000',
            // 'check.color': '#000000',
            // 'progress.border': '1px solid #efefee',
            // 'progress.backgroundColor': '#ffffff',
            // 'progress.foregroundColor': '#000000'
          } as any, // Use type assertion to handle theme properties
          initMenu: 'filter',
          menuBarPosition: 'bottom'
        },
        cssMaxWidth: 700,
        cssMaxHeight: 500,
        usageStatistics: false
      });
    }).catch(error => {
      console.error('Failed to load ImageEditor:', error);
    });
  }
  
  downloadImage() {
    if (this.imageEditor) {
      // Get image data as blob
      const imageBlob = this.imageEditor.toBlob();
      if (imageBlob) {
        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(imageBlob);
        link.download = 'edited-image.png';
        link.click();
        
        // Clean up
        URL.revokeObjectURL(link.href);
      }
    }
  }
  
  // Toolbar methods
  onCropClick() {
    this.activeTool = 'crop';
    this.showPropertiesPanel = true;
    // In a real implementation, you would activate crop mode in TUI ImageEditor
    if (this.imageEditor) {
      // Example: this.imageEditor.startDrawingMode('crop');
    }
  }
  
  onFlipClick() {
    // In a real implementation, you would flip the image in TUI ImageEditor
    if (this.imageEditor) {
      // Example: this.imageEditor.flipX();
    }
  }
  
  onRotateClick() {
    // In a real implementation, you would rotate the image in TUI ImageEditor
    if (this.imageEditor) {
      // Example: this.imageEditor.rotate(90);
    }
  }
  
  onDrawClick() {
    this.activeTool = 'draw';
    this.showPropertiesPanel = true;
    // In a real implementation, you would activate draw mode in TUI ImageEditor
    if (this.imageEditor) {
      // Example: this.imageEditor.startDrawingMode('freeDrawing');
    }
  }
  
  onShapeClick() {
    this.activeTool = 'shape';
    this.showPropertiesPanel = true;
    // In a real implementation, you would activate shape mode in TUI ImageEditor
    if (this.imageEditor) {
      // Example: this.imageEditor.startDrawingMode('shape');
    }
  }
  
  onTextClick() {
    this.activeTool = 'text';
    this.showPropertiesPanel = true;
    // In a real implementation, you would activate text mode in TUI ImageEditor
    if (this.imageEditor) {
      // Example: this.imageEditor.startDrawingMode('text');
    }
  }
  
  // AI Image Generation
  onAIClick() {
    console.log('onAIClick');
    this.showAIPanel = true;
  }
  
  onCloseAI() {
    this.showAIPanel = false;
  }
  
  // Handle AI generated image
  onImageGenerated(imageUrl: string) {
    // Load the AI generated image into the editor
    if (this.imageEditor) {
      // Clear current editor content
      this.imageEditor.clear();
      
      // Load new image
      this.imageEditor.loadImageFromURL(imageUrl, 'ai-generated-image');
    }
    
    // Close AI panel
    this.showAIPanel = false;
  }
  
  onFilterClick() {
    console.log('onFilterClick');
    this.activeTool = 'filter';
    this.showPropertiesPanel = true;
    // In a real implementation, you would activate filter mode in TUI ImageEditor
    if (this.imageEditor) {
      // Example: this.imageEditor.applyFilter('grayscale');
    }
  }
  
  onUndoClick() {
    // In a real implementation, you would undo the last action in TUI ImageEditor
    if (this.imageEditor) {
      // Example: this.imageEditor.undo();
    }
  }
  
  onRedoClick() {
    // In a real implementation, you would redo the last action in TUI ImageEditor
    if (this.imageEditor) {
      // Example: this.imageEditor.redo();
    }
  }
  
  // Properties panel methods
  onCloseProperties() {
    this.showPropertiesPanel = false;
  }
  
  onApplyProperties(properties: any) {
    // Apply properties based on active tool
    if (this.imageEditor) {
      switch (this.activeTool) {
        case 'crop':
          // Apply crop properties
          if (properties.crop) {
            // Example: this.imageEditor.crop(properties.crop);
          }
          break;
        case 'draw':
          // Apply draw properties
          if (properties.draw) {
            // Example: this.imageEditor.setDrawingColor(properties.draw.color);
            // Example: this.imageEditor.setDrawingWidth(properties.draw.width);
          }
          break;
        case 'text':
          // Apply text properties
          if (properties.text) {
            // Example: this.imageEditor.addText(properties.text);
          }
          break;
        case 'filter':
          // Apply filter properties
          if (properties.filter) {
            // Example: this.imageEditor.applyFilter(properties.filter);
          }
          break;
      }
    }
    this.showPropertiesPanel = false;
  }
  
  onCancelProperties() {
    this.showPropertiesPanel = false;
  }
}

// Image editor directive
export const ImageEditorDirective = {
  restrict: 'E',
  scope: {
    imageUrl: '='
  },
  templateUrl: '/src/image-editor/image-editor.html',
  controller: [ImageEditorController],
  controllerAs: 'vm',
  bindToController: true
};

// Register directive
imageEditorModule.directive('imageEditor', () => ImageEditorDirective);

export default imageEditorModule;
