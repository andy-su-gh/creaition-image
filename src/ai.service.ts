// Declare global angular variable
declare const angular: any;

// AI Service implementation for image generation and chat completions
export default class AIService {
  // API configurations
  private apiConfig = {
    huggingFace: {
      baseUrl: '/api/huggingface/models',
      timeout: 300000 // five minutes
    },
    models: {
      'stable-diffusion-v1.5': 'stabilityai/stable-diffusion-v1-5',
      'stable-diffusion-xl-base-1.0': 'stabilityai/stable-diffusion-xl-base-1.0',
      'qwen-vl-plus': 'Qwen/Qwen-VL-Plus',

      stableDiffusion: 'stabilityai/stable-diffusion-xl-base-1.0',
      qwenImageEdit: 'Qwen/Qwen-Image-Edit'
    } as Record<string, string>,
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_AI_API_KEY || ''}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  // supported models configuration
  private modelConfigs: { [key: string]: any } = {
    'stable-diffusion-v1.5': {
      aspectRatios: ['1:1', '16:9', '4:3'],
      supportedSamplers: ['Euler', 'DPMSolver', 'DDIM', 'Karras', 'DPMSolverMultistepScheduler'],
      recommendedParameters: {
        'text-to-image': { steps: 20, guidanceScale: 7.5 },
        'image-to-image': { steps: 15, guidanceScale: 7.0 }
      },
      requiresAuth: false,
      name: 'stable-diffusion-v1.5',
      displayName: 'Stable Diffusion v1.5',
      provider: 'huggingface',
      supportedModes: ['text-to-image', 'image-to-image', 'inpainting'],
      defaultParameters: {
        width: 512,
        height: 512,
        steps: 20,
        guidanceScale: 7.5,
        sampler: 'DPMSolverMultistepScheduler'
      },
      maxSize: 1024,
      minSize: 256,
      features: ['high_quality', 'fast_generation'],
      description: 'Stable Diffusion v1.5 is a high-quality text-to-image model.',
      version: '1.5'
    },
    'stable-diffusion-xl-base-1.0': {
      aspectRatios: ['1:1', '16:9', '4:3'],
      supportedSamplers: ['Euler', 'DPMSolver', 'DDIM', 'Karras', 'DPMSolverMultistepScheduler'],
      recommendedParameters: {
        'text-to-image': { steps: 20, guidanceScale: 7.5 },
        'image-to-image': { steps: 15, guidanceScale: 7.0 }
      },
      requiresAuth: false,
      name: 'stable-diffusion-xl-base-1.0',
      displayName: 'Stable Diffusion XL',
      provider: 'huggingface',
      supportedModes: ['text-to-image', 'image-to-image', 'inpainting'],
      defaultParameters: {
        width: 512,
        height: 512,
        steps: 20,
        guidanceScale: 7.5,
        sampler: 'DPMSolverMultistepScheduler'
      },
      maxSize: 1024,
      minSize: 256,
      features: ['high_quality', 'fast_generation'],
      description: 'Stable Diffusion XL is a high-quality text-to-image model.',
      version: '1.0'
    },
    'qwen-vl-plus': {
      aspectRatios: ['1:1', '4:3'],
      supportedSamplers: ['Euler', 'DPMSolver'],
      recommendedParameters: {
        'text-to-image': { steps: 25, guidanceScale: 7.0 },
        'image-to-image': { steps: 20, guidanceScale: 6.5 }
      },
      requiresAuth: false,
      name: 'qwen-vl-plus',
      displayName: 'Qwen VL Plus',
      provider: 'huggingface',
      supportedModes: ['text-to-image', 'image-to-image', 'vision'],
      defaultParameters: {
        width: 512,
        height: 512,
        steps: 25,
        guidanceScale: 7.0
      },
      maxSize: 1024,
      minSize: 256,
      features: ['image_editing', 'text_understanding'],
      description: 'Qwen VL Plus is a multimodal image understanding model.',
      version: '1.0'
    },

  };

  // Retry configuration
  private retryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    multiplier: 2
  };

  // State tracking
  private currentGeneration: {
    id: string;
    progress: number;
    status: 'idle' | 'generating' | 'completed' | 'failed';
    prompt: string;
    model: string;
    parameters: any;
  } = {
    id: '',
    progress: 0,
    status: 'idle',
    prompt: '',
    model: this.apiConfig.models.stableDiffusion,
    parameters: {}
  };

  // Generation history
  private generationHistory: Array<{
    id: string;
    prompt: string;
    model: string;
    parameters: any;
    imageUrl: string;
    createdAt: Date;
    status: 'completed' | 'failed';
    favorite: boolean;
  }> = [];

  // Dependencies
  $http: any;
  $q: any;
  $rootScope: any;

  // Constructor
  constructor($http: any, $q: any, $rootScope: any) {
    this.$http = $http;
    this.$q = $q;
    this.$rootScope = $rootScope;
    
    // Load history from localStorage
    this.loadHistoryFromStorage();
    // Load saved API key
    this.loadSavedApiKey();
  }

  // Generate image using Hugging Face API
  generateImage(promptOrParams: string | any, parameters: any = {}) {
    // Support both: generateImage(prompt, params) and generateImage(params)
    let prompt: string;
    let actualParams: any;
    
    if (typeof promptOrParams === 'string') {
      prompt = promptOrParams;
      actualParams = parameters;
    } else {
      prompt = promptOrParams.prompt;
      actualParams = promptOrParams;
    }
    const deferred = this.$q.defer();
    const generationId = this.generateId();
    // Map user-friendly model name to actual Hugging Face model path
    const userSelectedModel = actualParams.model || 'stable-diffusion-xl-base-1.0';
    const selectedModel = this.apiConfig.models[userSelectedModel] || userSelectedModel;
    const isBatch = actualParams.isBatch || false;
    const mode = actualParams.mode || 'text-to-image';

    // Create local generation state
    const generationState = {
      id: generationId,
      progress: 0,
      status: 'generating' as 'idle' | 'generating' | 'completed' | 'failed',
      prompt: prompt,
      model: selectedModel,
      parameters: actualParams,
      mode: mode
    };

    // Update current generation state only if not a batch operation
    if (!isBatch) {
      this.currentGeneration = generationState;
    }

    // Get model configuration
    const modelConfig = this.modelConfigs[userSelectedModel];
    if (!modelConfig) {
      const error = new Error(`Model ${userSelectedModel} is not supported`);
      this.handleApiError(error, generationState, generationId, isBatch, deferred);
      return;
    }

    // Validate request parameters
    const validationError = this.validateRequest(generationState, modelConfig);
    if (validationError) {
      this.handleApiError(validationError, generationState, generationId, isBatch, deferred);
      return;
    }

    // Prepare request payload
    const request = {
      id: generationId,
      prompt: prompt,
      mode: mode,
      model: userSelectedModel,
      parameters: actualParams,
      timestamp: Date.now(),
      negativePrompt: actualParams.negativePrompt,
      inputImage: actualParams.inputImage,
      maskImage: actualParams.maskImage
    };

    const payload = this.buildHuggingFacePayload(request);
    
    // Check if API key is set
    if (!this.apiConfig.headers.Authorization || this.apiConfig.headers.Authorization === 'Bearer ') {
      const error = new Error('API key not set. Please provide a valid Hugging Face API key.');
      this.handleApiError(error, generationState, generationId, isBatch, deferred);
      return;
    }
    
    // Make API call with retry logic
    // For api-inference endpoint, we need to include model in the URL
    const modelEndpoint = `${this.apiConfig.huggingFace.baseUrl}/${selectedModel}`;
    this.makeApiCall(modelEndpoint, payload, 0)
      .then((response: any) => {
        // Map API response
        const mappedResponse = this.mapHuggingFaceResponse(response, request);
        // Convert response to image URL
        const imageUrl = this.convertToImageUrl(mappedResponse);
        
        // Update generation state
        generationState.progress = 100;
        generationState.status = 'completed';
        
        // Update current generation if not batch
        if (!isBatch) {
          this.currentGeneration = generationState;
        }
        
        // Broadcast generation progress event
        this.$rootScope.$broadcast('aiGeneration:progress', {
          generationId: generationId,
          progress: 100,
          status: 'completed'
        });

        // Add to history
        const historyItem = {
          id: generationId,
          prompt: prompt,
          model: selectedModel,
          parameters: actualParams,
          imageUrl: imageUrl,
          createdAt: new Date(),
          status: 'completed'
        };
        this.addToHistory(historyItem);
        
        // Broadcast generation completed event
        this.$rootScope.$broadcast('aiGeneration:completed', {
          generationId: generationId,
          imageUrl: imageUrl,
          historyItem: historyItem
        });

        deferred.resolve(imageUrl);
      })
      .catch((error: any) => {
        this.handleApiError(error, generationState, generationId, isBatch, deferred);
      });

    return deferred.promise;
  }

  // Image-to-image generation
  generateImageFromImage(prompt: string, baseImage: string, parameters: any = {}) {
    // Call generateImage with mode set to image-to-image
    return this.generateImage({
      prompt: prompt,
      inputImage: baseImage,
      mode: 'image-to-image',
      model: parameters.model,
      parameters: parameters,
      ...parameters
    });
  }

  // Inpainting generation
  generateImageInpainting(prompt: string, baseImage: string, maskImage: string, parameters: any = {}) {
    // Call generateImage with mode set to inpainting
    return this.generateImage({
      prompt: prompt,
      inputImage: baseImage,
      maskImage: maskImage,
      mode: 'inpainting',
      model: parameters.model,
      parameters: parameters,
      ...parameters
    });
  }

  // Generate chat completion using Hugging Face API
  generateChatCompletion(messages: Array<any>, parameters: any = {}) {
    const deferred = this.$q.defer();
    
    // Map user-friendly model name to actual Hugging Face model path
    const userSelectedModel = parameters.model || 'stable-diffusion-xl-base-1.0';
    const selectedModel = this.apiConfig.models[userSelectedModel] || userSelectedModel;
    
    // Check if API key is set
    if (!this.apiConfig.headers.Authorization || this.apiConfig.headers.Authorization === 'Bearer ') {
      const error = new Error('API key not set. Please provide a valid Hugging Face API key.');
      deferred.reject(error);
      return deferred.promise;
    }
    
    // Prepare request payload
    const payload = {
      messages: messages,
      model: selectedModel,
      stream: parameters.stream || false,
      temperature: parameters.temperature || 0.7,
      max_tokens: parameters.max_tokens || 1000,
      ...parameters
    };
    
    const endpoint = `${this.apiConfig.huggingFace.baseUrl}/google/flan-t5-xxl`;
    
    // Make API call with retry logic
    this.makeApiCall(endpoint, payload, 0)
      .then((response: any) => {
        // Process response
        if (response && response.choices && response.choices.length > 0) {
          deferred.resolve(response.choices[0].message.content);
        } else if (response && response.generated_text) {
          deferred.resolve(response.generated_text);
        } else {
          deferred.reject(new Error('No response content found'));
        }
      })
      .catch((error: any) => {
        deferred.reject(error);
      });
    
    return deferred.promise;
  }

  // Commented out testQuery function to avoid TypeScript errors since it's not used
  // private async testQuery(data: any) {
  // 	const response = await fetch(
  // 		"https://router.huggingface.co/nscale/v1/images/generations",
  // 		{
  // 			headers: {
  // 				Authorization: `Bearer your-huggingface-access-token`,
  // 				"Content-Type": "application/json",
  // 			},
  // 			method: "POST",
  // 			body: JSON.stringify(data),
  // 		}
  // 	);
  // 	const result = await response.blob();
  // 	return result;
  // }


  // Make API call with retry logic
  private makeApiCall(endpoint: string, payload: any, attempt: number) {
    const deferred = this.$q.defer();

    // Update progress simulation
    this.updateProgress(attempt);

    // Log the final request for debugging
    console.log('=== API REQUEST DEBUG ===');
    console.log('Endpoint:', endpoint);
    console.log('Request Payload:', payload);
    console.log('Request Headers:', this.apiConfig.headers);
    console.log('Vite Proxy will convert to:', 'https://api-inference.huggingface.co/models' + endpoint.replace('/api/huggingface/models', ''));
    
    // Generate and log curl command
    const finalUrl = 'https://api-inference.huggingface.co/models' + endpoint.replace('/api/huggingface/models', '');
    const headersStr = Object.entries(this.apiConfig.headers)
      .map(([key, value]) => `-H "${key}: ${value}"`)
      .join(' ');
    const payloadStr = `-d '${JSON.stringify(payload)}'`;
    const curlCommand = `curl -X POST ${headersStr} ${payloadStr} "${finalUrl}"`;
    console.log('Equivalent Curl Command:');
    console.log(curlCommand);
    console.log('========================');


    // test query

    // Commented out test query to avoid automatic generation on every API call
    // this.testQuery({ 
    //   response_format: "b64_json",
    //   prompt: "\"Astronaut riding a horse\"",
    //   model: "stabilityai/stable-diffusion-xl-base-1.0", 
    // }).then((response) => {
    //   // Use image
    //   const imageUrl = URL.createObjectURL(response);
    //   console.log('Generated Image URL:', imageUrl);
    //   
    //   // Create a unique generation ID
    //   const generationId = `test-gen-${Date.now()}`;
    //   
    //   // Broadcast generation completed event to UI
    //   this.$rootScope.$broadcast('aiGeneration:completed', {
    //     generationId: generationId,
    //     imageUrl: imageUrl,
    //     historyItem: {
    //       id: generationId,
    //       prompt: "Astronaut riding a horse",
    //       model: "stabilityai/stable-diffusion-xl-base-1.0",
    //       parameters: {},
    //       imageUrl: imageUrl,
    //       createdAt: new Date(),
    //       status: 'completed'
    //     }
    //   });
    // });

    this.$http({
      method: 'POST',
      url: endpoint,
      headers: this.apiConfig.headers,
      data: payload,
      timeout: this.apiConfig.huggingFace.timeout
    })
    .then((response: any) => {
      if (response.status === 200) {
        deferred.resolve(response.data);
      } else {
        const errorMsg = `API Error: ${response.status} ${response.statusText} - ${JSON.stringify(response.data)}`;
        console.error(errorMsg);
        deferred.reject(new Error(errorMsg));
      }
    })
    .catch((error: any) => {
        // Log detailed error information
        console.error('=== API ERROR DETAILS ===');
        console.error('Error:', error);
        console.error('Error Status:', error.status);
        console.error('Error Status Text:', error.statusText);
        console.error('Error Data:', error.data);
        console.error('Error Config:', error.config);
        console.error('========================');
        
        // Handle rate limiting and retry
        if ((error.status === 429 || error.status === 503) && attempt < this.retryConfig.maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // exponential backoff, max 30s
          setTimeout(() => {
            this.makeApiCall(endpoint, payload, attempt + 1)
              .then(deferred.resolve)
              .catch(deferred.reject);
          }, delay);
        } else {
          // Create descriptive error message
          const apiError = this.handleHuggingFaceError(error, { id: 'api-call' });
          deferred.reject(apiError);
        }
    });

    return deferred.promise;
  }

  /**
   * build Hugging Face request payload
   */
  private buildHuggingFacePayload(request: any): any {
    const basePayload = {
      inputs: request.prompt,
      parameters: {
        width: request.parameters.width,
        height: request.parameters.height,
        num_inference_steps: request.parameters.steps || 20,
        guidance_scale: request.parameters.guidanceScale || 7.5,
        negative_prompt: request.negativePrompt,
        seed: request.parameters.seed,
        strength: request.parameters.strength
      }
    };

    // by model and mode, adjust payload
    switch (request.mode) {
      case 'image-to-image':
        if (!request.inputImage) {
          throw new Error('Input image is required for image-to-image generation');
        }
        basePayload.inputs = request.inputImage.replace(/^data:image\/\w+;base64,/, '');
        basePayload.parameters.strength = request.parameters.strength || 0.8;
        break;

      case 'inpainting':
        if (!request.inputImage || !request.maskImage) {
          throw new Error('Input image and mask image are required for inpainting');
        }
        basePayload.inputs = request.inputImage.replace(/^data:image\/\w+;base64,/, '');
        (basePayload.parameters as any)['mask_image'] = request.maskImage.replace(/^data:image\/\w+;base64,/, '');
        break;
    }

    return basePayload;
  }

  /**
   * map Hugging Face response
   */
  private mapHuggingFaceResponse(response: any, request: any): any {
    // Hugging Face API may return different structures based on model
    let imageData = response.generated_image || response.image;

    // If response is base64 string, use it directly
    if (typeof response === 'string' && /^[A-Za-z0-9+/=]+$/.test(response.substring(0, 40))) {
      imageData = response;
    }

    // If response has images array
    if (response && response.images && Array.isArray(response.images)) {
      imageData = response.images[0];
    }

    if (!imageData) {
      throw new Error('No image data received from API');
    }

    return {
      id: request.id,
      requestId: request.id,
      images: [imageData],
      metadata: {
        generationTime: Date.now() - request.timestamp,
        model: request.model,
        parameters: request.parameters,
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        seed: request.parameters.seed ?? 0,
        stepsCompleted: request.parameters.steps,
        totalSteps: request.parameters.steps
      },
      timestamp: Date.now()
    };
  }

  // Helper method to handle API errors consistently
  private handleApiError(error: Error, generationState: any, generationId: string, isBatch: boolean, deferred: any) {
    // Update generation state
    generationState.status = 'failed';
    
    // Update current generation if not batch
    if (!isBatch) {
      this.currentGeneration = generationState;
    }
    
    // Log error
    console.error('AI Generation Error:', error);
    
    // Broadcast generation progress event with failed status
    this.$rootScope.$broadcast('aiGeneration:progress', {
      generationId: generationId,
      progress: 0,
      status: 'failed'
    });

    // Add to history with failed status
    const historyItem = {
      id: generationId,
      prompt: generationState.prompt,
      model: generationState.model,
      parameters: generationState.parameters,
      imageUrl: '',
      createdAt: new Date(),
      status: 'failed'
    };
    this.addToHistory(historyItem);
    
    // Broadcast generation failed event
    this.$rootScope.$broadcast('aiGeneration:failed', {
      generationId: generationId,
      error: error,
      historyItem: historyItem
    });
    
    deferred.reject(error);
  }

  /**
   * handle Hugging Face errors
   */
  private handleHuggingFaceError(error: any, request: any): Error {
    let errorMessage = 'API request failed';
    let status = error.status;
    let details = error.data;

    if (error.status === 401) {
      errorMessage = 'Authentication failed: Invalid API key';
    } else if (error.status === 403) {
      errorMessage = 'Authorization failed: Insufficient permissions';
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (error.status === 404) {
      errorMessage = 'Model not found';
    } else if (error.status === 503) {
      errorMessage = 'Model is loading. Please try again in a few moments.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.status === -1) {
      errorMessage = 'Network error. Please check your connection.';
    }

    // Create error object with message and status
    const apiError = new Error(errorMessage);
    (apiError as any).status = status;
    (apiError as any).details = details;
    (apiError as any).requestId = request.id;

    return apiError;
  }

  /**
   * validate request parameters
   */
  private validateRequest(request: any, modelConfig: any): Error | null {
    if (!request.prompt || request.prompt.trim().length < 2) {
      return new Error('Prompt must be at least 2 characters long');
    }

    if (request.parameters.width > modelConfig.maxSize || request.parameters.height > modelConfig.maxSize) {
      return new Error(`Image size cannot exceed ${modelConfig.maxSize}x${modelConfig.maxSize}`);
    }

    if (request.parameters.width < modelConfig.minSize || request.parameters.height < modelConfig.minSize) {
      return new Error(`Image size cannot be less than ${modelConfig.minSize}x${modelConfig.minSize}`);
    }

    if (!modelConfig.supportedModes.includes(request.mode)) {
      return new Error(`Mode ${request.mode} is not supported for this model`);
    }

    if ((request.mode === 'image-to-image' || request.mode === 'inpainting') && !request.inputImage) {
      return new Error('Input image is required for this generation mode');
    }

    if (request.mode === 'inpainting' && !request.maskImage) {
      return new Error('Mask image is required for inpainting');
    }

    return null;
  }

  /**
   * check all API status
   */
  checkAllAPIStatus(): any {
    const deferred = this.$q.defer();
    const startTime = Date.now();
    const testModel = 'stabilityai/stable-diffusion-xl-base-1.0';
    
    // Check if API key is set
    if (!this.apiConfig.headers.Authorization || this.apiConfig.headers.Authorization === 'Bearer ') {
      const error = new Error('API key not set. Please provide a valid Hugging Face API key.');
      deferred.reject(error);
      return deferred.promise;
    }
    
    // For api-inference endpoint, we need to include model in the URL
    const testEndpoint = `${this.apiConfig.huggingFace.baseUrl}/${testModel}`;
    const testPayload = {
      inputs: 'test prompt',
      parameters: {
        width: 64,
        height: 64,
        num_inference_steps: 1
      }
    };
    
    this.$http.post(testEndpoint, testPayload, { 
      headers: this.apiConfig.headers,
      timeout: 10000 
    })
    .then(() => {
      const latency = Date.now() - startTime;
      deferred.resolve({ isAvailable: true, latency: latency });
    })
    .catch((error: any) => {
      console.error('API Status Check Error:', error);
      deferred.resolve({ isAvailable: false, latency: -1, error: error.status + ' ' + error.statusText });
    });
    
    return deferred.promise;
  }

  /**
   * get supported models configuration
   */
  getSupportedModels(): any[] {
    return Object.values(this.modelConfigs);
  }

  // Update generation progress (simulated)
  private updateProgress(attempt: number) {
    if (this.currentGeneration.status === 'generating') {
      const baseProgress = 20 + attempt * 10;
      this.currentGeneration.progress = Math.min(baseProgress + Math.random() * 20, 90);
      
      // Continue updating progress until generation is complete
      if (this.currentGeneration.progress < 90) {
        setTimeout(() => {
          this.updateProgress(attempt);
        }, 500);
      }
    }
  }

  // Convert API response to image URL
  private convertToImageUrl(response: any): string {
    if (!response) {
      throw new Error('Invalid API response');
    }

    // If response has images array
    if (response.images && Array.isArray(response.images)) {
      const imageData = response.images[0];
      return this.base64ToImageUrl(imageData);
    }

    // If response has image data directly
    if (response.image) {
      return this.base64ToImageUrl(response.image);
    }

    // If response is already processed (from mapHuggingFaceResponse)
    if (response.generated_image) {
      return this.base64ToImageUrl(response.generated_image);
    }

    throw new Error('Invalid API response format');
  }

  // Helper to convert base64 to image URL
  private base64ToImageUrl(base64Data: string): string {
    if (!base64Data.startsWith('data:')) {
      return `data:image/png;base64,${base64Data}`;
    }
    return base64Data;
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Add generation to history
  private addToHistory(item: any) {
    this.generationHistory.unshift(item);
    
    // Limit history size
    const maxHistoryItems = parseInt(import.meta.env.VITE_MAX_HISTORY_ITEMS || '20');
    if (this.generationHistory.length > maxHistoryItems) {
      this.generationHistory = this.generationHistory.slice(0, maxHistoryItems);
    }
    
    // Save to localStorage
    this.saveHistoryToStorage();
  }

  // Save history to localStorage
  private saveHistoryToStorage() {
    localStorage.setItem('aiGenerationHistory', JSON.stringify(this.generationHistory));
  }

  // Load history from localStorage
  private loadHistoryFromStorage() {
    const savedHistory = localStorage.getItem('aiGenerationHistory');
    if (savedHistory) {
      try {
        this.generationHistory = JSON.parse(savedHistory);
      } catch (error) {
        console.error('Error loading generation history from localStorage:', error);
        this.generationHistory = [];
      }
    }
  }

  // Get current generation state
  getCurrentGeneration() {
    return angular.copy(this.currentGeneration);
  }

  // Get generation history (compatible with getHistory method used in MainController)
  getGenerationHistory() {
    return angular.copy(this.generationHistory);
  }
  
  // Alias for getGenerationHistory to match what's used in MainController
  getHistory() {
    return this.getGenerationHistory();
  }
  
  // Subscribe to generation updates
  subscribe(callback: Function) {
    // Create event listener for generation updates
    const eventNames = ['aiGeneration:progress', 'aiGeneration:completed', 'aiGeneration:failed'];
    const listeners: any[] = [];
    
    eventNames.forEach(eventName => {
      const listener = (_event: any, data: any) => {
        // Map event types to the format expected by MainController
        let type: string;
        if (eventName === 'aiGeneration:progress') {
          type = data.status === 'failed' ? 'error' : 'progress';
        } else if (eventName === 'aiGeneration:completed') {
          type = 'completed';
        } else {
          type = 'error';
        }
        
        callback({
          type: type,
          progress: data.progress || 0,
          message: data.error?.message || '',
          imageUrl: data.imageUrl || '',
          generationId: data.generationId || ''
        });
      };
      
      this.$rootScope.$on(eventName, listener);
      listeners.push({ eventName, listener });
    });
    
    // Return unsubscribe method
    return {
      unsubscribe: () => {
        listeners.forEach(({ eventName, listener }) => {
          this.$rootScope.$off(eventName, listener);
        });
      }
    };
  }

  // Clear generation history
  clearGenerationHistory() {
    this.generationHistory = [];
    this.saveHistoryToStorage();
  }

  // Set favorite status for a generation
  toggleFavorite(generationId: string) {
    const generation = this.generationHistory.find(g => g.id === generationId);
    if (generation) {
      generation.favorite = !generation.favorite;
      this.saveHistoryToStorage();
    }
  }

  // Get favorite generations
  getFavoriteGenerations() {
    return this.generationHistory.filter(g => g.favorite);
  }

  // Update API key
  updateApiKey(apiKey: string) {
    this.apiConfig.headers.Authorization = `Bearer ${apiKey}`;
    localStorage.setItem('huggingFaceApiKey', apiKey);
  }
  
  // Set API key (alias for updateApiKey)
  setApiKey(apiKey: string) {
    this.updateApiKey(apiKey);
  }

  // Load saved API key
  loadSavedApiKey() {
    const savedKey = localStorage.getItem('huggingFaceApiKey');
    if (savedKey) {
      this.updateApiKey(savedKey);
    }
  }

  // Get API configuration (for debugging)
  getApiConfig() {
    return angular.copy(this.apiConfig);
  }
}

