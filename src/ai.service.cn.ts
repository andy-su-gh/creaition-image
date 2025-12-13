// Declare global angular variable
declare const angular: any;

/**
 * Generation State Interface
 */
interface GenerationState {
  id: string;
  mode?: string;
  prompt: string;
  parameters?: GenerationParameters;
  isBatch?: boolean;
  progress?: number;
  status?: 'idle' | 'generating' | 'completed' | 'failed';
  model?: string;
  error?: string;
}

/**
 * Generation Parameters Interface
 */
interface GenerationParameters {
  width?: number;
  height?: number;
  steps?: number;
  guidanceScale?: number;
  negativePrompt?: string;
}

/**
 * Model Configuration Interface
 */
interface ModelConfig {
  aspectRatios: string[];
  recommendedParameters: Record<string, any>;
  requiresAuth: boolean;
  name: string;
  displayName: string;
  provider: string;
  supportedModes: string[];
  defaultParameters: GenerationParameters;
  maxSize: number;
  minSize: number;
  features: string[];
  description: string;
}

/**
 * API Configuration Interface
 */
interface APIConfig {
  hunyuan: {
    baseUrl: string;
    timeout: number;
  };
  credentials: {
    secretId: string;
    secretKey: string;
  };
  models: Record<string, string>;
  headers: Record<string, string>;
}

/**
 * Retry Configuration Interface
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
}

/**
 * Generation History Item Interface
 */
interface HistoryItem {
  id: string;
  prompt: string;
  model: string;
  parameters: GenerationParameters;
  imageUrl: string;
  createdAt: Date;
  status: 'completed' | 'failed';
}

/**
 * Tencent Hunyuan API Response Interface
 */
interface HunyuanResponse {
  Images?: string[];
  Image?: string;
  ResultImage?: string;
  [key: string]: any;
}

/**
 * Processed API Response Interface
 */
interface ProcessedResponse {
  images: Array<{ b64_json: string } | string>;
}

/**
 * AI Service implementation for image generation using Tencent Hunyuan API
 */
export default class AIService {
  // API configurations for Tencent Hunyuan
  private apiConfig: APIConfig = {
    hunyuan: {
      baseUrl: '/api/tencentcloud',
      timeout: 300000 // five minutes
    },
    credentials: {
      secretId: import.meta.env.VITE_TENCENT_SECRET_ID || '',
      secretKey: import.meta.env.VITE_TENCENT_SECRET_KEY || ''
    },
    models: {
      'hunyuan-text-to-image': 'hunyuan-text-to-image'
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  // supported models configuration
  private modelConfigs: Record<string, ModelConfig> = {
    'hunyuan-text-to-image': {
      aspectRatios: ['1:1', '16:9', '4:3'],
      recommendedParameters: {
        'text-to-image': { steps: 50, guidanceScale: 7.5 }
      },
      requiresAuth: true,
      name: 'hunyuan-text-to-image',
      displayName: 'Tencent Hunyuan Text-to-Image',
      provider: 'tencent',
      supportedModes: ['text-to-image'],
      defaultParameters: {
        width: 512,
        height: 512,
        steps: 50,
        guidanceScale: 7.5
      },
      maxSize: 1024,
      minSize: 256,
      features: ['high_quality', 'fast_generation'],
      description: 'Tencent Hunyuan Text-to-Image generation model.'
    }
  };

  // generation history
  private history: HistoryItem[] = [];

  // current generation state
  private currentGeneration: GenerationState | null = null;

  // retry configuration
  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000
  };

  // Dependencies
  private $rootScope: any;
  private $http: any;
  private $q: any;

  // Constructor to inject Angular dependencies
  constructor($http: any, $q: any, $rootScope: any) {
    this.$http = $http;
    this.$q = $q;
    this.$rootScope = $rootScope;
  }

  /**
   * Generate image from text prompt
   */
  generateImage(generationState: GenerationState) {
    const deferred = this.$q.defer();
    const generationId = generationState.id;
    const mode = generationState.mode || 'text-to-image';
    const prompt = generationState.prompt;
    const parameters = generationState.parameters || {};
    const isBatch = generationState.isBatch || false;

    try {
      // Validate required fields
      this.validateGenerationRequest(prompt);

      // Always use Tencent Hunyuan model
      const selectedModel = this.apiConfig.models['hunyuan-text-to-image'];
      const modelConfig = this.getModelConfig(selectedModel);

      // Prepare actual parameters with defaults
      const actualParams = this.buildGenerationParameters(modelConfig, parameters);

      // Update generation state
      this.updateGenerationState(generationState, actualParams, selectedModel, 0, 'generating');

      // Update current generation if not batch
      if (!isBatch) {
        this.currentGeneration = generationState;
      }

      // Broadcast initial progress
      this.broadcastProgress(generationId, 0, 'generating');

      // Prepare and execute request
      this.executeGenerationRequest(generationId, prompt, mode, selectedModel, actualParams, generationState, isBatch, deferred);
    } catch (error: any) {
      this.handleApiError(error, generationState, generationId, isBatch, deferred);
    }

    return deferred.promise;
  }

  /**
   * Validate generation request
   */
  private validateGenerationRequest(prompt: string): void {
    if (!prompt || prompt.trim() === '') {
      throw new Error('Prompt is required');
    }
  }

  /**
   * Get model configuration by name
   */
  private getModelConfig(modelName: string): ModelConfig {
    const modelConfig = this.modelConfigs[modelName];
    if (!modelConfig) {
      throw new Error(`Model '${modelName}' not supported`);
    }
    return modelConfig;
  }

  /**
   * Build generation parameters with defaults
   */
  private buildGenerationParameters(modelConfig: ModelConfig, parameters: GenerationParameters): GenerationParameters {
    return { ...modelConfig.defaultParameters, ...parameters };
  }

  /**
   * Update generation state
   */
  private updateGenerationState(
    generationState: GenerationState, 
    parameters: GenerationParameters, 
    model: string, 
    progress: number, 
    status: 'idle' | 'generating' | 'completed' | 'failed'
  ): void {
    generationState.progress = progress;
    generationState.status = status;
    generationState.model = model;
    generationState.parameters = parameters;
  }

  /**
   * Broadcast generation progress event
   */
  private broadcastProgress(generationId: string, progress: number, status: string, error?: string): void {
    this.$rootScope.$broadcast('aiGeneration:progress', {
      generationId,
      progress,
      status,
      error
    });
  }

  /**
   * Execute generation request
   */
  private executeGenerationRequest(
    generationId: string,
    prompt: string,
    mode: string,
    selectedModel: string,
    actualParams: GenerationParameters,
    generationState: GenerationState,
    isBatch: boolean,
    deferred: any
  ): void {
    // Prepare request payload
    const request = {
      id: generationId,
      prompt,
      mode,
      model: selectedModel,
      parameters: actualParams,
      timestamp: Date.now(),
      negativePrompt: actualParams.negativePrompt || ''
    };

    // Build API payload
    const payload = this.buildHunyuanPayload(request);

    // Make API call with retry logic
    this.makeApiCall(payload, 0)
      .then((response: any) => this.handleSuccessfulResponse(response, request, generationState, generationId, selectedModel, actualParams, isBatch, deferred))
      .catch((error: any) => this.handleApiError(error, generationState, generationId, isBatch, deferred));
  }

  /**
   * Handle successful API response
   */
  private handleSuccessfulResponse(
    response: any,
    request: any,
    generationState: GenerationState,
    generationId: string,
    selectedModel: string,
    actualParams: GenerationParameters,
    isBatch: boolean,
    deferred: any
  ): void {
    try {
      // Map API response
      const mappedResponse = this.mapHunyuanResponse(response, request);
      // Convert response to image URL
      const imageUrl = this.convertToImageUrl(mappedResponse);
      
      // Update generation state
      this.updateGenerationState(generationState, actualParams, selectedModel, 100, 'completed');
      
      // Update current generation if not batch
      if (!isBatch) {
        this.currentGeneration = generationState;
      }
      
      // Broadcast completion
      this.broadcastProgress(generationId, 100, 'completed');

      // Add to history
      const historyItem = this.createHistoryItem(generationId, request.prompt, selectedModel, actualParams, imageUrl);
      this.addToHistory(historyItem);
      
      // Broadcast generation completed event
      this.$rootScope.$broadcast('aiGeneration:completed', {
        generationId,
        imageUrl,
        historyItem
      });

      deferred.resolve(imageUrl);
    } catch (error: any) {
      this.handleApiError(error, generationState, generationId, isBatch, deferred);
    }
  }

  /**
   * Create history item
   */
  private createHistoryItem(
    id: string,
    prompt: string,
    model: string,
    parameters: GenerationParameters,
    imageUrl: string
  ): HistoryItem {
    return {
      id,
      prompt,
      model,
      parameters,
      imageUrl,
      createdAt: new Date(),
      status: 'completed'
    };
  }

  /**
   * Make API call with retry logic
   */
  private makeApiCall(payload: any, attempt: number) {
    const deferred = this.$q.defer();

    // Update progress simulation
    this.updateProgress(attempt);

    // Generate request signature and execute request
    this.generateSignature(payload)
      .then((signatureInfo: any) => {
        this.logRequestDetails(signatureInfo, payload);
        return this.executeHttpRequest(payload, signatureInfo.headers);
      })
      .then((response: any) => this.handleApiResponse(response, deferred))
      .catch((error: any) => this.handleApiRequestError(error, payload, attempt, deferred));

    return deferred.promise;
  }

  /**
   * Log request details for debugging
   */
  private logRequestDetails(signatureInfo: any, payload: any): void {
    console.log('=== TENCENT HUNYUAN API REQUEST ===');
    console.log('Endpoint:', this.apiConfig.hunyuan.baseUrl);
    console.log('Request Payload:', payload);
    console.log('Signature Info:', signatureInfo);
    console.log('====================================');
  }

  /**
   * Execute HTTP request
   */
  private executeHttpRequest(payload: any, signatureHeaders: any) {
    // Create full headers with signature
    const headers = {
      ...this.apiConfig.headers,
      ...signatureHeaders
    };

    return this.$http({
      method: 'POST',
      url: this.apiConfig.hunyuan.baseUrl,
      headers: headers,
      data: payload,
      timeout: this.apiConfig.hunyuan.timeout
    });
  }

  /**
   * Handle API response
   */
  private handleApiResponse(response: any, deferred: any): void {
    if (response.status === 200 && response.data.Response) {
      deferred.resolve(response.data.Response);
    } else {
      const errorMsg = `API Error: ${response.status} ${response.statusText} - ${JSON.stringify(response.data)}`;
      console.error(errorMsg);
      deferred.reject(new Error(errorMsg));
    }
  }

  /**
   * Handle API request error with retry logic
   */
  private handleApiRequestError(error: any, payload: any, attempt: number, deferred: any): void {
    // Log detailed error information
    this.logErrorDetails(error);
    
    // Handle rate limiting and retry
    if (this.shouldRetryRequest(error, attempt)) {
      this.scheduleRetry(payload, attempt, deferred);
    } else {
      const errorMsg = this.createErrorMessage(error);
      deferred.reject(new Error(errorMsg));
    }
  }

  /**
   * Log error details
   */
  private logErrorDetails(error: any): void {
    console.error('=== API ERROR DETAILS ===');
    console.error('Error:', error);
    console.error('Error Status:', error.status);
    console.error('Error Status Text:', error.statusText);
    console.error('Error Data:', error.data);
    console.error('Error Config:', error.config);
    console.error('========================');
  }

  /**
   * Check if request should be retried
   */
  private shouldRetryRequest(error: any, attempt: number): boolean {
    return ((error.status === 429 || error.status === 503) && attempt < this.retryConfig.maxAttempts);
  }

  /**
   * Schedule retry with exponential backoff
   */
  private scheduleRetry(payload: any, attempt: number, deferred: any): void {
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // exponential backoff, max 30s
    setTimeout(() => {
      this.makeApiCall(payload, attempt + 1)
        .then(deferred.resolve)
        .catch(deferred.reject);
    }, delay);
  }

  /**
   * Create descriptive error message
   */
  private createErrorMessage(error: any): string {
    let errorMsg = 'Failed to generate image';
    if (error.data && error.data.Response && error.data.Response.Error) {
      errorMsg += `: ${error.data.Response.Error.Message}`;
    } else if (error.statusText) {
      errorMsg += `: ${error.statusText}`;
    }
    return errorMsg;
  }

  /**
   * Generate signature for Tencent Cloud API using TC3-HMAC-SHA256 standard
   */
  private async generateSignature(payload: any) {
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
    const nonce = Math.floor(Math.random() * 1000000);
    const service = 'aiart';
    const region = 'ap-guangzhou';
    const action = 'TextToImageLite';
    const version = '2022-12-29';
    const host = 'aiart.tencentcloudapi.com';
    
    try {
      // Step 1: Create canonical request
      const canonicalRequest = await this.createCanonicalRequest(host, payload);
      
      // Step 2: Create string to sign
      const stringToSign = await this.createStringToSign(timestamp, date, service, canonicalRequest);
      
      // Step 3: Calculate signature
      const signatureHex = await this.calculateSignature(date, service, stringToSign);
      
      // Step 4: Create authorization header
      const authorization = this.createAuthorizationHeader(date, service, signatureHex);
      
      return this.buildSignatureResult(action, version, region, timestamp, nonce, authorization);
    } catch (error: any) {
      console.error('Signature generation failed:', error);
      throw error;
    }
  }

  /**
   * Create canonical request
   */
  private async createCanonicalRequest(host: string, payload: any): Promise<string> {
    const canonicalUri = '/';
    const canonicalQueryString = ''; // No query parameters for POST requests
    const canonicalHeaders = `content-type:application/json\nhost:${host}\n`;
    const signedHeaders = 'content-type;host';
    const hashedRequestPayload = await this.sha256(JSON.stringify(payload));
    
    return `POST\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;
  }

  /**
   * Create string to sign
   */
  private async createStringToSign(timestamp: number, date: string, service: string, canonicalRequest: string): Promise<string> {
    const credentialScope = `${date}/${service}/tc3_request`;
    const hashedCanonicalRequest = await this.sha256(canonicalRequest);
    
    return `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
  }

  /**
   * Calculate signature
   */
  private async calculateSignature(date: string, service: string, stringToSign: string): Promise<string> {
    const signingKey = await this.deriveSigningKey(this.apiConfig.credentials.secretKey, date, service);
    return await this.hmacsha256Hex(signingKey, stringToSign);
  }

  /**
   * Create authorization header
   */
  private createAuthorizationHeader(date: string, service: string, signatureHex: string): string {
    const credentialScope = `${date}/${service}/tc3_request`;
    const signedHeaders = 'content-type;host';
    
    return `TC3-HMAC-SHA256 Credential=${this.apiConfig.credentials.secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;
  }

  /**
   * Build signature result
   */
  private buildSignatureResult(action: string, version: string, region: string, timestamp: number, nonce: number, authorization: string): any {
    return {
      parameters: {
        Action: action,
        Version: version,
        Region: region,
        Timestamp: timestamp,
        Nonce: nonce
      },
      headers: {
        'Authorization': authorization,
        'X-TC-Action': action,
        'X-TC-Region': region,
        'X-TC-Version': version,
        'X-TC-Timestamp': timestamp.toString(),
        'X-TC-Nonce': nonce.toString()
      }
    };
  }

  // SHA256 hash generation
  private async sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToHex(hash);
  }

  // HMAC-SHA256 signature generation
  private async hmacsha256(secret: string | ArrayBuffer, message: string): Promise<ArrayBuffer> {
    let keyData: ArrayBuffer;
    if (typeof secret === 'string') {
      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(secret);
      keyData = uint8Array.buffer;
    } else {
      keyData = secret;
    }

    const encoder = new TextEncoder();
    const messageData = encoder.encode(message);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      false,
      ['sign']
    );

    return await crypto.subtle.sign('HMAC', key, messageData);
  }

  // HMAC-SHA256 signature generation returning hex string
  private async hmacsha256Hex(secret: string | ArrayBuffer, message: string): Promise<string> {
    const signature = await this.hmacsha256(secret, message);
    return this.arrayBufferToHex(signature);
  }

  // Derive signing key (same as tc3-signature.ts)
  private async deriveSigningKey(secretKey: string, date: string, service: string): Promise<ArrayBuffer> {
    const kDate = await this.hmacsha256('TC3' + secretKey, date);
    const kService = await this.hmacsha256(kDate, service);
    const kSigning = await this.hmacsha256(kService, 'tc3_request');
    return kSigning;
  }

  // Convert ArrayBuffer to hex string
  private arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Build payload for Tencent Hunyuan API
  private buildHunyuanPayload(request: any) {
    // Map our request format to Tencent Hunyuan API format
    // Ignore style parameter, only use prompt
    return {
      Prompt: request.prompt,
      Resolution: `${request.parameters.width}:${request.parameters.height}`,
      // Number: 1
    };
  }

  /**
   * Map Tencent Hunyuan API response to our internal format
   */
  private mapHunyuanResponse(response: HunyuanResponse, _request: any): ProcessedResponse {
    // Log the complete response for debugging
    this.logResponseDetails(response);
    
    // Handle response from Tencent Hunyuan API
    if (response) {
      // Check various possible response formats
      if (this.isValidImageArrayResponse(response.Images)) {
        return this.mapImagesArrayResponse(response.Images!);
      } 
      
      if (this.isValidImageResponse(response.Image)) {
        return this.mapSingleImageResponse(response.Image!);
      }
      
      if (this.isValidImageResponse(response.ResultImage)) {
        return this.mapSingleImageResponse(response.ResultImage!);
      }
      
      if (this.isValidStringResponse(response)) {
        return this.mapStringResponse(response as unknown as string);
      }
    }
    
    // If no images found in any expected format
    console.error('No images found in any expected format');
    throw new Error('No images found in response');
  }

  /**
   * Log response details
   */
  private logResponseDetails(response: HunyuanResponse): void {
    console.log('=== TENCENT HUNYUAN API RESPONSE ===');
    console.log('Response Type:', typeof response);
    console.log('Response Keys:', Object.keys(response || {}));
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('====================================');
  }

  /**
   * Check if response contains valid images array
   */
  private isValidImageArrayResponse(images: string[] | undefined): boolean {
    return Array.isArray(images) && images.length > 0;
  }

  /**
   * Check if response contains valid single image
   */
  private isValidImageResponse(image: string | undefined): boolean {
    return typeof image === 'string' && image.length > 0;
  }

  /**
   * Check if response itself is a valid string
   */
  private isValidStringResponse(response: any): boolean {
    return typeof response === 'string' && response.length > 0;
  }

  /**
   * Map images array response
   */
  private mapImagesArrayResponse(images: string[]): ProcessedResponse {
    console.log('Images field found:', images);
    console.log('Images length:', images.length);
    
    return {
      images: images.map((imageBase64: string) => ({
        b64_json: imageBase64
      }))
    };
  }

  /**
   * Map single image response
   */
  private mapSingleImageResponse(image: string): ProcessedResponse {
    console.log('Single image field found:');
    
    return {
      images: [{
        b64_json: image
      }]
    };
  }

  /**
   * Map string response
   */
  private mapStringResponse(response: string): ProcessedResponse {
    console.log('Response is a string, assuming it\'s base64 image data');
    
    return {
      images: [{
        b64_json: response
      }]
    };
  }

  // Convert API response to image URL
  private convertToImageUrl(response: any) {
    if (!response || !response.images || response.images.length === 0) {
      throw new Error('Invalid response format');
    }

    // Get the first image
    const imageData = response.images[0];
    let base64Data: string;

    // Handle different response formats
    if (typeof imageData === 'string') {
      base64Data = imageData;
    } else if (imageData.b64_json) {
      base64Data = imageData.b64_json;
    } else {
      throw new Error('Invalid image data format');
    }

    // Create blob from base64 data
    const blob = this.base64ToBlob(base64Data, 'image/png');
    // Create image URL
    return URL.createObjectURL(blob);
  }

  // Convert base64 string to blob
  private base64ToBlob(base64: string, contentType: string) {
    const byteCharacters = atob(base64);
    const byteArray = new Uint8Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }

    return new Blob([byteArray], { type: contentType });
  }

  // Update progress simulation
  private updateProgress(attempt: number) {
    // Simple progress update logic
    const progress = Math.min((attempt + 1) * 20, 80);
    this.$rootScope.$broadcast('aiGeneration:progress', {
      progress: progress,
      status: 'generating'
    });
  }



  /**
   * Handle API errors
   */
  private handleApiError(error: Error, generationState: GenerationState, generationId: string, isBatch: boolean, deferred: any) {
    console.error('API Error:', error);
    
    // Update generation state
    generationState.progress = 0;
    generationState.status = 'failed';
    generationState.error = error.message;
    
    // Update current generation if not batch
    if (!isBatch) {
      this.currentGeneration = generationState;
    }
    
    // Broadcast generation failed event
    this.broadcastProgress(generationId, 0, 'failed', error.message);

    deferred.reject(error);
  }

  // Add generation to history
  private addToHistory(historyItem: any) {
    this.history.unshift(historyItem);
    // Limit history size
    if (this.history.length > 100) {
      this.history.pop();
    }
  }



  // Additional methods required for compatibility
  generateImageFromImage(_prompt: string, _baseImage: string, _parameters: any = {}) {
    return this.$q.reject(new Error('Image-to-image not supported by Tencent Hunyuan in this implementation'));
  }

  generateImageInpainting(_prompt: string, _baseImage: string, _maskImage: string, _parameters: any = {}) {
    return this.$q.reject(new Error('Inpainting not supported by Tencent Hunyuan in this implementation'));
  }

  generateChatCompletion(_messages: any[], _parameters: any = {}) {
    return this.$q.reject(new Error('Chat completion not supported by Tencent Hunyuan in this implementation'));
  }

  getHistory() {
    return this.history;
  }

  getModelConfigs() {
    return this.modelConfigs;
  }

  // Get current generation (for compatibility)
  getCurrentGeneration() {
    return this.currentGeneration;
  }

  /**
   * Subscribe to generation updates
   */
  subscribe(callback: (update: any) => void) {
    // Create event listener for generation updates
    const eventNames = ['aiGeneration:progress', 'aiGeneration:completed', 'aiGeneration:failed'];
    const unsubscribeFunctions: Function[] = [];
    
    eventNames.forEach(eventName => {
      const listener = (_event: any, data: any) => {
        // Map event types to the format expected by MainController
        const eventType = this.mapEventNameToType(eventName, data);
        
        callback({
          type: eventType,
          progress: data.progress || 0,
          message: data.error || '',
          imageUrl: data.imageUrl || '',
          generationId: data.generationId || ''
        });
      };
      
      // In AngularJS, $on returns an unsubscribe function
      const unsubscribe = this.$rootScope.$on(eventName, listener);
      unsubscribeFunctions.push(unsubscribe);
    });
    
    // Return unsubscribe method
    return {
      unsubscribe: () => this.cleanupEventListeners(unsubscribeFunctions)
    };
  }

  /**
   * Map event name to update type
   */
  private mapEventNameToType(eventName: string, data: any): string {
    if (eventName === 'aiGeneration:progress') {
      return data.status === 'failed' ? 'error' : 'progress';
    } else if (eventName === 'aiGeneration:completed') {
      return 'completed';
    } else {
      return 'error';
    }
  }

  /**
   * Cleanup event listeners
   */
  private cleanupEventListeners(unsubscribeFunctions: Function[]): void {
    unsubscribeFunctions.forEach(unsubscribe => {
      unsubscribe();
    });
  }
}