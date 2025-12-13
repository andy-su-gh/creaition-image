import { AIStateService } from './ai-state.service';

describe('AIStateService', () => {
  let service: AIStateService;

  beforeEach(() => {
    service = new AIStateService();
  });

  it('should initialize with correct initial state', () => {
    const state = service.getState();
    
    expect(state.prompt).toBe('');
    expect(state.generatedImages).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
    expect(state.history).toEqual([]);
    expect(state.favorites).toEqual([]);
  });

  it('should update prompt correctly', () => {
    const testPrompt = 'A beautiful sunset';
    service.setPrompt(testPrompt);
    
    expect(service.getState().prompt).toBe(testPrompt);
  });

  it('should set loading state correctly', () => {
    service.startLoading();
    
    expect(service.getState().loading).toBe(true);
    expect(service.getState().error).toBe(null);
  });

  it('should add generated image correctly', () => {
    const testPrompt = 'A beautiful sunset';
    const testImageUrl = 'data:image/png;base64,testimage';
    
    service.setPrompt(testPrompt);
    service.addGeneratedImage(testImageUrl);
    
    const state = service.getState();
    
    expect(state.generatedImages.length).toBe(1);
    expect(state.history.length).toBe(1);
    expect(state.generatedImages[0].prompt).toBe(testPrompt);
    expect(state.generatedImages[0].url).toBe(testImageUrl);
    expect(state.generatedImages[0].isFavorite).toBe(false);
    expect(state.loading).toBe(false);
  });

  it('should set error correctly', () => {
    const testError = 'Failed to generate image';
    service.setError(testError);
    
    expect(service.getState().error).toBe(testError);
    expect(service.getState().loading).toBe(false);
  });

  it('should toggle favorite status correctly', () => {
    const testImageUrl = 'data:image/png;base64,testimage';
    
    service.addGeneratedImage(testImageUrl);
    const image = service.getState().generatedImages[0];
    
    // Toggle to favorite
    service.toggleFavorite(image.id);
    expect(service.getState().favorites.length).toBe(1);
    expect(service.getState().generatedImages[0].isFavorite).toBe(true);
    expect(service.getState().history[0].isFavorite).toBe(true);
    
    // Toggle back to not favorite
    service.toggleFavorite(image.id);
    expect(service.getState().favorites.length).toBe(0);
    expect(service.getState().generatedImages[0].isFavorite).toBe(false);
    expect(service.getState().history[0].isFavorite).toBe(false);
  });

  it('should clear generated images correctly', () => {
    const testImageUrl = 'data:image/png;base64,testimage';
    
    service.addGeneratedImage(testImageUrl);
    service.clearGeneratedImages();
    
    expect(service.getState().generatedImages.length).toBe(0);
    expect(service.getState().history.length).toBe(1); // History should still have the image
  });

  it('should clear history correctly', () => {
    const testImageUrl = 'data:image/png;base64,testimage';
    
    service.addGeneratedImage(testImageUrl);
    service.toggleFavorite(service.getState().generatedImages[0].id);
    service.clearHistory();
    
    expect(service.getState().history.length).toBe(0);
    expect(service.getState().favorites.length).toBe(0);
  });

  it('should get image by ID correctly', () => {
    const testImageUrl = 'data:image/png;base64,testimage';
    
    service.addGeneratedImage(testImageUrl);
    const image = service.getState().generatedImages[0];
    
    const foundImage = service.getImageById(image.id);
    
    expect(foundImage).toBeDefined();
    expect(foundImage?.id).toBe(image.id);
    expect(foundImage?.url).toBe(image.url);
    
    // Test with non-existent ID
    const notFoundImage = service.getImageById('non-existent-id');
    expect(notFoundImage).toBeUndefined();
  });

  it('should emit state changes to subscribers', (done) => {
    const testPrompt = 'A beautiful sunset';
    
    service.select(state => state.prompt).subscribe(prompt => {
      if (prompt === testPrompt) {
        done();
      }
    });
    
    service.setPrompt(testPrompt);
  });
});