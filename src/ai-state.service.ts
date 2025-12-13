import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

// Define interfaces for the state
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
  isFavorite: boolean;
}

export interface AIGenerationState {
  prompt: string;
  generatedImages: GeneratedImage[];
  loading: boolean;
  error: string | null;
  history: GeneratedImage[];
  favorites: GeneratedImage[];
}

// AngularJS wrapper for the service
declare var angular: any;

// RxJS State Service class
export class AIStateService {
  private initialState: AIGenerationState = {
    prompt: '',
    generatedImages: [{
      id: 'default-mock-image',
      url: '/assets/mock-image.png',
      prompt: 'Default mock image',
      timestamp: new Date(),
      isFavorite: false
    }],
    loading: false,
    error: null,
    history: [{
      id: 'default-mock-image',
      url: '/assets/mock-image.png',
      prompt: 'Default mock image',
      timestamp: new Date(),
      isFavorite: false
    }],
    favorites: []
  };

  private stateSubject = new BehaviorSubject<AIGenerationState>(this.initialState);
  private state$ = this.stateSubject.asObservable();

  // Get current state
  getState(): AIGenerationState {
    return this.stateSubject.getValue();
  }

  // Observable for state changes
  getState$(): Observable<AIGenerationState> {
    return this.state$;
  }

  // Select specific parts of the state
  select<T>(selector: (state: AIGenerationState) => T): Observable<T> {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    );
  }

  // Update prompt
  setPrompt(prompt: string): void {
    this.updateState(prevState => ({
      ...prevState,
      prompt
    }));
  }

  // Start loading state
  startLoading(): void {
    this.updateState(prevState => ({
      ...prevState,
      loading: true,
      error: null
    }));
  }

  // Add generated image
  addGeneratedImage(imageUrl: string): void {
    const newImage: GeneratedImage = {
      id: Date.now().toString(),
      url: imageUrl,
      prompt: this.getState().prompt,
      timestamp: new Date(),
      isFavorite: false
    };

    this.updateState(prevState => {
      const updatedImages = [...prevState.generatedImages, newImage];
      const updatedHistory = [...prevState.history, newImage];
      
      return {
        ...prevState,
        generatedImages: updatedImages,
        history: updatedHistory,
        loading: false
      };
    });
  }

  // Clear generated images
  clearGeneratedImages(): void {
    this.updateState(prevState => ({
      ...prevState,
      generatedImages: []
    }));
  }

  // Set error message
  setError(error: string): void {
    this.updateState(prevState => ({
      ...prevState,
      error,
      loading: false
    }));
  }

  // Toggle favorite status
  toggleFavorite(imageId: string): void {
    this.updateState(prevState => {
      // Update in generated images
      const updatedGeneratedImages = prevState.generatedImages.map(image =>
        image.id === imageId ? { ...image, isFavorite: !image.isFavorite } : image
      );

      // Update in history
      const updatedHistory = prevState.history.map(image =>
        image.id === imageId ? { ...image, isFavorite: !image.isFavorite } : image
      );

      // Update favorites list
      const image = updatedHistory.find(img => img.id === imageId);
      let updatedFavorites = [...prevState.favorites];
      
      if (image) {
        if (image.isFavorite) {
          // Add to favorites
          updatedFavorites.push(image);
        } else {
          // Remove from favorites
          updatedFavorites = updatedFavorites.filter(img => img.id !== imageId);
        }
      }

      return {
        ...prevState,
        generatedImages: updatedGeneratedImages,
        history: updatedHistory,
        favorites: updatedFavorites
      };
    });
  }

  // Get image by ID
  getImageById(imageId: string): GeneratedImage | undefined {
    return this.getState().history.find(image => image.id === imageId);
  }

  // Clear history
  clearHistory(): void {
    this.updateState(prevState => ({
      ...prevState,
      history: [],
      favorites: [] // Clear favorites as well when clearing history
    }));
  }

  // Private method to update state
  private updateState(updaterFn: (prevState: AIGenerationState) => AIGenerationState): void {
    const currentState = this.getState();
    const newState = updaterFn(currentState);
    this.stateSubject.next(newState);
  }
}

// AIStateService will be registered in main.ts