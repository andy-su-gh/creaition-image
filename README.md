# Creaition Image Demo

An AI-powered image creation and management tool with built-in image editor, based on AngularJS.

## Technology Stack

- **Frontend Framework**: AngularJS 1.8.x
- **Build Tool**: Vite
- **Programming Language**: TypeScript
- **UI Framework**: Bootstrap 5
- **Image Editor**: tui-image-editor
- **State Management**: AngularJS Services + Local Storage
- **Unit Testing**: Karma + Jasmine
- **AI Integration**: Mock AI Image Generation API

## Features Implemented

### Core Features
- ✨ **AI Image Generation**: Generate images based on text descriptions
- 🎨 **Multiple Style Options**: Support for realistic, cartoon, abstract, anime, oil painting, and sketch styles
- 🖌️ **Built-in Image Editor**: Edit generated images with comprehensive tools including:
  - Drawing tools (pencil, brush, eraser)
  - Text addition with customizable fonts and styles
  - Shape insertion (rectangle, circle, line)
  - Image filter effects
  - Crop, flip, and rotate functions
  - Undo/redo capabilities
- 📱 **Responsive Design**: Adapt to desktop and mobile devices with optimized layouts
- 📝 **History Record**: Save generation history with timestamps for easy review
- 💾 **Image Download**: Support downloading generated and edited images
- 🎯 **User-Friendly Interface**: Simple and intuitive operation experience with smooth animations

### UI/UX Features
- 🔄 **Real-time Preview**: See image generation and editing results immediately
- 🎨 **Customizable Editor Theme**: Personalize the image editor's appearance
- 📊 **Progress Indicators**: Visual feedback during image generation and processing
- 📱 **Touch Support**: Compatible with touch devices for drawing and editing

## Setup Instructions

### Environment Requirements

- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd creaition-image
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env.development` and `.env.production`
   - Update API keys and configuration in these files

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will start at `http://localhost:5173`.

5. **Build Production Version**
   ```bash
   npm run build
   ```

   Build artifacts will be output to the `dist` directory.

6. **Preview Production Version**
   ```bash
   npm run preview
   ```

## API Configuration Steps

### AI Image Generation API

The application uses a mock AI service by default. To integrate with a real AI image generation API:

1. **Obtain API Credentials**
   - Sign up for an API key from your preferred provider (OpenAI DALL-E, Stability AI, etc.)
   - Ensure you have the necessary permissions for image generation

2. **Update Environment Variables**
   - Open `.env.development` and `.env.production` files
   - Add your API key and endpoint configuration:
   ```
   VITE_AI_API_ENDPOINT=https://api.example.com/generate
   VITE_AI_API_KEY=your-api-key-here
   ```

3. **Update AI Service**
   - Modify `src/ai.service.ts` to use your real API:
   ```typescript
   import { AIResponse } from './types';
   
   export class AIService {
     private apiEndpoint: string;
     private apiKey: string;
     
     constructor() {
       this.apiEndpoint = import.meta.env.VITE_AI_API_ENDPOINT || '';
       this.apiKey = import.meta.env.VITE_AI_API_KEY || '';
     }
     
     generateImage(prompt: string, style: string): Promise<string> {
       return fetch(this.apiEndpoint, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${this.apiKey}`
         },
         body: JSON.stringify({
           prompt: prompt,
           style: style,
           size: '800x600'
         })
       })
       .then(response => {
         if (!response.ok) {
           throw new Error('API request failed');
         }
         return response.json();
       })
       .then((data: AIResponse) => data.imageUrl);
     }
   }
   ```

4. **Test the Integration**
   - Start the development server
   - Try generating an image to ensure the API integration works correctly

## Design Decisions Made

### Framework Selection
- **AngularJS**: Chosen for its mature ecosystem, two-way data binding, and component-based architecture, which simplifies UI management and state handling.

### Image Editor Integration
- **tui-image-editor**: Selected for its comprehensive feature set, TypeScript support, and active maintenance. It provides all necessary editing tools while being lightweight enough for web applications.

### Build Tool Choice
- **Vite**: Preferred over Webpack for its faster development server and build times, which significantly improves the developer experience during iterative development.

### State Management Strategy
- **AngularJS Services + Local Storage**: Used for managing application state and persisting user data. Local Storage provides offline capabilities for history records without requiring a backend database.

### UI/UX Design Principles
- **Mobile-First Approach**: Designed responsive layouts starting from mobile devices and scaling up to desktop for optimal cross-device experience.
- **Intuitive Navigation**: Placed commonly used functions (generate, edit, download) in prominent locations for easy access.
- **Visual Feedback**: Implemented loading states, progress indicators, and success/error messages to keep users informed about system status.
- **Consistent Styling**: Applied a unified design system with consistent colors, typography, and spacing throughout the application.

### Animation Strategy
- **CSS Transitions**: Used for smooth UI animations (panel slides, button hover effects) to enhance user experience without performance overhead.
- **Conditional Rendering**: Implemented show/hide animations for panels using CSS classes instead of DOM removal for better performance.

## Challenges Faced

### Integration Challenges
- **tui-image-editor Configuration**: Customizing the editor's theme and toolbar required deep understanding of its internal CSS structure and theme system. Had to override default styles and add custom theme properties.
- **AngularJS Directive Communication**: Implementing smooth communication between components (main app, AI panel, image editor) required careful design of event handlers and callback functions.

### Performance Issues
- **Large Bundle Size**: tui-image-editor library significantly increased the bundle size. Implemented dynamic import to reduce initial load time.
- **Memory Management**: Image editing operations can consume significant memory, especially with large images. Added proper cleanup mechanisms to prevent memory leaks.

### UI/UX Challenges
- **Responsive Layout**: Creating a responsive image editor interface that works well on both desktop and mobile devices required complex CSS grid and flexbox configurations.
- **Animation Synchronization**: Ensuring smooth animations between different UI states (panel slides, editor transitions) required careful coordination of CSS transitions and JavaScript event handling.

### Development Environment
- **TypeScript with AngularJS**: Integrating TypeScript with AngularJS 1.8.x required additional configuration and type definitions to ensure type safety.
- **Vite and AngularJS Compatibility**: Configuring Vite to work properly with AngularJS required custom plugin settings and build configurations.

## Project Structure

```
creaition-image/
├── src/
│   ├── main.ts                    # Application entry, AngularJS configuration
│   ├── style.css                  # Global styles and CSS variables
│   ├── ai.service.ts              # AI image generation service
│   ├── ai.service.spec.ts         # AI service tests
│   └── image-editor/
│       ├── image-editor.html      # Image editor template
│       ├── image-editor.css       # Image editor styles
│       ├── image-editor.module.ts # Image editor directive and controller
│       ├── toolbar/
│       │   ├── toolbar.html       # Editor toolbar template
│       │   └── toolbar.module.ts  # Toolbar directive and controller
│       ├── properties-panel/
│       │   ├── properties-panel.html # Properties panel template
│       │   └── properties-panel.module.ts # Properties panel directive
│       └── ai-panel/
│           ├── ai-panel.html      # AI generation panel template
│           ├── ai-panel.css       # AI panel styles
│           └── ai-panel.module.ts # AI panel directive and controller
├── index.html                     # Main HTML template
├── .env.development               # Development environment variables
├── .env.production                # Production environment variables
├── karma.conf.cjs                 # Karma test configuration
├── package.json                   # Project configuration and dependencies
├── tsconfig.json                  # TypeScript configuration
└── vite.config.ts                 # Vite configuration
```

## Testing

Run unit tests:

```bash
npm run test
```

## License

MIT License

## Contribution

Welcome to submit Issues and Pull Requests!

---

© 2025 Creaition Image Demo


## integration issues with hugging face api

curl --location --request POST 'https://router.huggingface.co/v1/chat/completions' \
--header 'Authorization: Bearer your-huggingface-access-token' \
--header 'Content-Type: application/json' \
--data-raw '{
        "messages": [
            {
                "role": "user",
                "content": "How many G in huggingface?"
            }
        ],
        "model": "openai/gpt-oss-120b:fastest",
        "stream": false
    }'

this is a official document for hugging face api call, but got timeout error

also tried with https://api-inference.huggingface.co, got same timeout error
