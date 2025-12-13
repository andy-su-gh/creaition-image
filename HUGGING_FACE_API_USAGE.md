# Hugging Face API Usage Guide

## 1. Configure API Key

### Method 1: Environment Variable Configuration

1. Open the environment configuration files in the project root directory:
   - Development environment: `.env.development`
   - Production environment: `.env.production`

2. Replace the value of `VITE_AI_API_KEY` with your Hugging Face Access Token:

```
# Development environment example (.env.development)
VITE_AI_API_KEY=your-hugging-face-access-token-here

# Production environment example (.env.production)
VITE_AI_API_KEY=your-hugging-face-access-token-here
```

### Method 2: In-App Settings

You can also set the API key through the interface while the application is running:

1. Find the API Key input field in the application interface
2. Enter your Hugging Face Access Token
3. Click the "Save API Key" button to save

## 2. Generate Images

### Basic Usage Steps

1. Enter your image description in the "Prompt" input field (e.g., "A cute kitten playing on the grass")
2. Select the model you want to use (default: Stable Diffusion)
3. Choose an image style (default: realistic)
4. Click the "Generate Image" button to start generation

### Advanced Parameters

You can modify the generation parameters in the code to achieve different effects:

- **prompt**: Image description text
- **model**: Model name (stable-diffusion-xl-base-1.0 or Qwen/Qwen-Image-Edit)
- **width/height**: Image dimensions
- **num_inference_steps**: Number of inference steps (default: 50)
- **guidance_scale**: Guidance scale (default: 7.5)
- **seed**: Random seed

## 3. API Key Management

API keys are stored in the browser's localStorage with the key name `huggingFaceApiKey`.

You can manage keys in the following ways:

- **View**: Enter `localStorage.getItem('huggingFaceApiKey')` in the browser console
- **Delete**: Enter `localStorage.removeItem('huggingFaceApiKey')` in the browser console
- **Update**: Re-enter and save a new key in the application interface

## 4. Common Issues

### API Call Failures

If you encounter API call failures, please check the following:

1. **API Key Validity**: Ensure your Hugging Face Access Token is valid and has appropriate permissions
2. **Network Connection**: Ensure your device can access `api-inference.huggingface.co`
3. **Request Frequency**: Hugging Face API may have request rate limits, please try again later
4. **Model Status**: Some models may take time to load, please be patient

### Image Quality Issues

If the generated image quality does not meet expectations:

1. **Optimize Prompt**: Provide more detailed and specific descriptions
2. **Adjust Parameters**: Increase inference steps or adjust guidance scale
3. **Try Different Models**: Switch to other available models

## 5. Supported Models

The application currently supports the following Hugging Face models:

- **Stable Diffusion XL**: `stabilityai/stable-diffusion-xl-base-1.0`
- **Qwen Image Edit**: `Qwen/Qwen-Image-Edit`

You can modify or add more models in the `src/ai.service.ts` file.

## 6. Technical Details

API calls use the following configuration:

- **Base URL**: `https://api-inference.huggingface.co/models`
- **Request Method**: POST
- **Request Headers**: 
  - Authorization: Bearer YOUR_ACCESS_TOKEN
  - Content-Type: application/json
- **Response Format**: Base64 encoded image data

## 7. Best Practices

1. **Protect API Keys**: Do not commit API keys to version control systems
2. **Use Environment Variables**: Use different API keys in different environments
3. **Limit Request Frequency**: Avoid sending too many requests in a short time
4. **Optimize Prompts**: Use detailed, specific descriptions for better results
5. **Save Generation Records**: The application automatically saves generation history for easy viewing and management

---

We hope this guide helps you successfully use the Hugging Face API to generate images! If you have any questions or suggestions, please feel free to raise them.