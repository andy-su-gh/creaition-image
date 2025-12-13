// Version: 1.1.0 - Clean Code and Design Improvements

// CSS Imports organized by scope
import './style.css';
// Image Editor CSS
import './image-editor/image-editor.css';
import './image-editor/toolbar/toolbar.css';
import './image-editor/properties-panel/properties-panel.css';
import './image-editor/ai-panel/ai-panel.css';
// Third-party CSS
import 'tui-image-editor/dist/tui-image-editor.css';

// AngularJS and Modules
import angular from 'angular';
import './image-editor/image-editor.module';

// Services
import AIService from './ai.service.cn';
import { AIStateService } from './ai-state.service';

// Create AngularJS application
const app = angular.module('creationImageApp', ['imageEditorModule']);

// Register services with proper dependency injection
app.service('AIService', ['$http', '$q', '$rootScope', AIService]);
app.service('AIStateService', [AIStateService]);

// Main Controller using AIService with RxJS state management
app.controller('MainController', ['$scope', 'AIService', 'AIStateService', function($scope: any, AIService: any, AIStateService: any) {
  // Initialize controller
  function initializeController() {
    $scope.prompt = 'flower';
    $scope.selectedStyle = 'realistic';
    $scope.currentYear = new Date().getFullYear();
    $scope.editorState = { showEditor: false };
    $scope.selectedModel = 'stable-diffusion-xl-base-1.0';
    $scope.progress = 0;
    
    // Initialize API key from localStorage
    $scope.apiKey = localStorage.getItem('huggingFaceApiKey') || '';
    
    // Initialize from state service
    const initialState = AIStateService.getState();
    $scope.generatedImage = initialState.generatedImages.length > 0 
      ? initialState.generatedImages[0].url 
      : null;
    
    // Subscribe to state changes
    subscribeToStateChanges();
  }
  
  // Subscribe to AI state changes
  function subscribeToStateChanges() {
    const stateSubscription = AIStateService.getState$().subscribe((state: any) => {
      $scope.generating = state.loading;
      $scope.error = state.error;
      $scope.history = state.history;
      $scope.favorites = state.favorites;
      $scope.generatedImages = state.generatedImages;
      
      // Update displayed image if there are generated images
      if (state.generatedImages && state.generatedImages.length > 0) {
        $scope.generatedImage = state.generatedImages[state.generatedImages.length - 1].url;
      }
      
      // Safe digest cycle update
      safeApply();
    });
    
    // Cleanup subscription on destroy
    $scope.$on('$destroy', () => stateSubscription.unsubscribe());
  }
  
  // Save API Key to localStorage and AIService
  $scope.saveApiKey = function() {
    localStorage.setItem('huggingFaceApiKey', $scope.apiKey);
    AIService.setApiKey($scope.apiKey);
  };
  
  // Generate image using AIService
  $scope.generateImage = function() {
    if (!isValidGenerationRequest()) return;
    
    // Update state
    AIStateService.setPrompt($scope.prompt);
    $scope.progress = 0;
    $scope.error = null;
    
    // Ensure API key is saved
    if ($scope.apiKey !== localStorage.getItem('huggingFaceApiKey')) {
      $scope.saveApiKey();
    }
    
    // Start generation
    startImageGeneration();
  };
  
  // Validate generation request
  function isValidGenerationRequest(): boolean {
    if (!$scope.prompt.trim()) {
      AIStateService.setError('Prompt is required');
      return false;
    }
    
    if ($scope.generating) {
      return false; // Prevent multiple concurrent requests
    }
    
    return true;
  }
  
  // Start image generation process
  function startImageGeneration() {
    const generationParams = buildGenerationParams();
    
    // Mark as loading in state
    AIStateService.startLoading();
    
    // Subscribe to generation updates
    const generationSubscription = AIService.subscribe((update: any) => {
      handleGenerationUpdate(update, generationSubscription);
    });
    
    // Execute generation
    AIService.generateImage(generationParams)
      .then((result: any) => console.log('Image generation completed:', result))
      .catch((error: any) => handleGenerationError(error, generationSubscription));
  }
  
  // Build generation parameters
  function buildGenerationParams() {
    return {
      prompt: $scope.prompt,
      model: $scope.selectedModel,
      style: $scope.selectedStyle,
      n: 1, // Number of images to generate
      width: 512,
      height: 512
    };
  }
  
  // Handle generation updates
  function handleGenerationUpdate(update: any, subscription: any) {
    switch (update.type) {
      case 'progress':
        $scope.progress = update.progress;
        safeApply();
        break;
      case 'error':
        AIStateService.setError(update.message);
        subscription.unsubscribe();
        break;
      case 'completed':
        AIStateService.addGeneratedImage(update.imageUrl);
        subscription.unsubscribe();
        break;
    }
  }
  
  // Handle generation errors
  function handleGenerationError(error: any, subscription: any) {
    const errorMessage = error.message || 'Image generation failed, please try again';
    AIStateService.setError(errorMessage);
    subscription.unsubscribe();
  }
  
  // Safe apply to prevent digest cycle errors
  function safeApply() {
    if (!$scope.$$phase && !$scope.$root.$$phase) {
      $scope.$apply();
    }
  }
  
  // Download generated image
  $scope.downloadImage = function() {
    if (!$scope.generatedImage) return;
    
    const link = document.createElement('a');
    link.href = $scope.generatedImage;
    link.download = `ai-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Open image editor
  $scope.openImageEditor = function() {
    if ($scope.generatedImage) {
      $scope.editorState.showEditor = true;
      safeApply();
    }
  };
  
  // Close image editor
  $scope.closeImageEditor = function() {
    $scope.editorState.showEditor = false;
    safeApply();
  };
  
  // Clear generated image
  $scope.clearImage = function() {
    $scope.generatedImage = '';
    AIStateService.clearGeneratedImages();
  };
  
  // Toggle favorite status
  $scope.toggleFavorite = function(imageId: string) {
    AIStateService.toggleFavorite(imageId);
  };
  
  // Clear generation history
  $scope.clearHistory = function() {
    AIStateService.clearHistory();
  };
  
  // Initialize controller
  initializeController();
}]);

console.log('Creaition Image Demo App initialized with mock image!');