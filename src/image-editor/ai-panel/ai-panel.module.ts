// Declare global angular variable
declare const angular: any;

// Import styles
import './ai-panel.css';

// AI Panel component module
const aiPanelModule = angular.module('aiPanelModule', []);

// AI Panel controller
export class AIPanelController {
  // Input properties
  onClose: () => void = () => {};
  onImageGenerated: (imageUrl: string) => void = () => {};
  
  // Internal state
  apiKey: string = '';
  prompt: string = '';
  selectedModel: string = 'stabilityai/stable-diffusion-xl-base-1.0';
  generating: boolean = false;
  generationProgress: number = 0;
  batchGenerating: boolean = false;
  batchSize: number = 1;
  
  // Parameters
  parameters: any = {
    width: 800,
    height: 600,
    style: 'realistic',
    steps: 50,
    cfg_scale: 7.5
  };
  
  // Prompt suggestions
  suggestions: string[] = [];
  
  // Generation history
  history: any[] = [];
  
  // Dependencies
  $scope: any;
  AIService: any;
  
  // Constructor
  constructor($scope: any, AIService: any) {
    this.$scope = $scope;
    this.AIService = AIService;
    
    // Load saved API key
    this.apiKey = localStorage.getItem('huggingFaceApiKey') || '';
    
    // Load generation history
    this.history = this.AIService.getGenerationHistory();
    
    // Handle AI generation events
    this.$scope.$on('aiGeneration:progress', (_event: any, data: any) => {
      this.generationProgress = data.progress;
      this.generating = data.status === 'generating';
      this.batchGenerating = this.batchGenerating && this.generating;
    });
    
    this.$scope.$on('aiGeneration:completed', (_event: any, data: any) => {
      this.generating = false;
      this.history = this.AIService.getGenerationHistory();
      
      if (this.onImageGenerated) {
        this.onImageGenerated(data.imageUrl);
      }
    });
    
    this.$scope.$on('aiGeneration:failed', (_event: any, _data: any) => {
      this.generating = false;
      this.history = this.AIService.getGenerationHistory();
      alert('图像生成失败，请检查API Key和网络连接。');
    });
  }
  
  // Update API Key
  updateApiKey() {
    if (this.apiKey) {
      this.AIService.updateApiKey(this.apiKey);
    }
  }
  
  // Update prompt suggestions
  updatePromptSuggestions() {
    if (!this.prompt.trim() || this.prompt.length < 3) {
      this.suggestions = [];
      return;
    }
    
    // Simple prompt suggestions based on input
    const baseSuggestions = [
      `${this.prompt} in a cyberpunk style`,
      `${this.prompt} with watercolor painting effect`,
      `${this.prompt} in a futuristic city`,
      `${this.prompt} under magical lighting`,
      `${this.prompt} with realistic details`,
      `${this.prompt} in anime style`,
      `${this.prompt} with vibrant colors`,
      `${this.prompt} in a fantasy world`
    ];
    
    this.suggestions = baseSuggestions;
  }
  
  // Select suggestion
  selectSuggestion(suggestion: string) {
    this.prompt = suggestion;
    this.suggestions = [];
  }
  
  // Generate single image
  generateImage() {
    if (!this.prompt.trim() || !this.apiKey) {
      alert('请输入提示词和API Key');
      return;
    }
    
    this.generating = true;
    this.generationProgress = 0;
    
    // Generate image using AI service
    this.AIService.generateImage(this.prompt, {
      model: this.selectedModel,
      parameters: this.parameters
    });
  }
  
  // Batch generate images
  batchGenerateImages() {
    if (!this.prompt.trim() || !this.apiKey) {
      alert('请输入提示词和API Key');
      return;
    }
    
    if (this.batchSize < 2 || this.batchSize > 5) {
      alert('批量生成数量必须在2-5之间');
      return;
    }
    
    this.batchGenerating = true;
    this.generating = true;
    this.generationProgress = 0;
    
    // Generate multiple images
    for (let i = 0; i < this.batchSize; i++) {
      this.AIService.generateImage(this.prompt, {
        model: this.selectedModel,
        parameters: { ...this.parameters, seed: Math.floor(Math.random() * 1000000) }
      }).then(() => {
        if (i === this.batchSize - 1) {
          this.batchGenerating = false;
          this.generating = false;
        }
      });
    }
  }
  
  // Load history item
  loadHistoryItem(item: any) {
    if (item.status === 'completed') {
      this.prompt = item.prompt;
      this.selectedModel = item.model;
      this.parameters = { ...item.parameters };
      
      if (this.onImageGenerated) {
        this.onImageGenerated(item.imageUrl);
      }
    }
  }
  
  // Close panel
  closePanel() {
    if (this.onClose) {
      this.onClose();
    }
  }
}

// AI Panel directive
export const AIPanelDirective = {
  restrict: 'E',
  scope: {
    showPanel: '=',
    onClose: '&',
    onImageGenerated: '&'
  },
  templateUrl: '/src/image-editor/ai-panel/ai-panel.html',
  controller: AIPanelController,
  controllerAs: 'vm',
  bindToController: true
};

// Register directive and controller
aiPanelModule.directive('aiPanel', () => AIPanelDirective);
aiPanelModule.controller('AIPanelController', ['$scope', 'AIService', AIPanelController]);

export default aiPanelModule;
