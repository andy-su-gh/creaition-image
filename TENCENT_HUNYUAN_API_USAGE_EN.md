# Tencent Hunyuan API Usage Guide

This document describes how to use the Tencent Hunyuan API for text-to-image operations in this project.

## 1. API Overview

The Tencent Hunyuan API is an image generation service provided by Tencent Cloud. By calling the `TextToImageLite` interface, you can generate images based on input text descriptions.

## 2. API Configuration

### 2.1 Basic Configuration

In the `ai.service.cn.ts` file, the API configuration information is as follows:

```javascript
private apiConfig = {
  hunyuan: {
    baseUrl: '/api/tencentcloud',
    timeout: 300000 // five minutes
  },
  credentials: {
    secretId: 'your-tencent-secret-id',
    secretKey: 'your-tencent-secret-key'
  }
};
```

### 2.2 Model Configuration

```javascript
private modelConfigs: any = {
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
```

## 3. API Call Flow

### 3.1 Generating a Request

In the `generateImage` method, request parameters are constructed and the API is called:

```javascript
// Build request payload
const request = {
  id: generationId,
  prompt: prompt,
  mode: mode,
  model: selectedModel,
  parameters: actualParams,
  timestamp: Date.now(),
  negativePrompt: actualParams.negativePrompt || ''
};

// Build Tencent Hunyuan API payload
const payload = this.buildHunyuanPayload(request);

// Call API
this.makeApiCall(payload, 0)
  .then((response: any) => {
    // Handle response
  })
  .catch((error: any) => {
    // Handle error
  });
```

### 3.2 Building Request Payload

```javascript
private buildHunyuanPayload(request: any) {
  return {
    Prompt: request.prompt,
    Resolution: `${request.parameters.width}:${request.parameters.height}`,
    // Number: 1
  };
}
```

## 4. API Signature Mechanism

This project uses the TC3-HMAC-SHA256 signature algorithm to sign API requests, ensuring the security of the requests. The signature generation process is as follows:

### 4.1 Generating a Signature

```javascript
private async generateSignature(payload: any) {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const nonce = Math.floor(Math.random() * 1000000);
  const service = 'aiart';
  const region = 'ap-guangzhou';
  const action = 'TextToImageLite';
  const version = '2022-12-29';
  
  // Build canonical request
  const host = 'aiart.tencentcloudapi.com';
  const canonicalUri = '/';
  const canonicalQueryString = '';
  const canonicalHeaders = `content-type:application/json\nhost:${host}\n`;
  const signedHeaders = 'content-type;host';
  const hashedRequestPayload = await this.sha256(JSON.stringify(payload));
  const canonicalRequest = `POST\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`;
  
  // Build string to sign
  const credentialScope = `${date}/${service}/tc3_request`;
  const hashedCanonicalRequest = await this.sha256(canonicalRequest);
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`;
  
  // Generate signing key
  const signingKey = await this.deriveSigningKey(this.apiConfig.credentials.secretKey, date, service);
  const signatureHex = await this.hmacsha256Hex(signingKey, stringToSign);
  
  // Build Authorization header
  const authorization = `TC3-HMAC-SHA256 Credential=${this.apiConfig.credentials.secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signatureHex}`;
  
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
```

### 4.2 Helper Methods

```javascript
// SHA256 hash generation
private async sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return this.arrayBufferToHex(hash);
}

// HMAC-SHA256 signature generation
private async hmacsha256(secret: string | ArrayBuffer, message: string): Promise<ArrayBuffer> {
  // Implementation details
}

// Derive signing key
private async deriveSigningKey(secretKey: string, date: string, service: string): Promise<ArrayBuffer> {
  const kDate = await this.hmacsha256('TC3' + secretKey, date);
  const kService = await this.hmacsha256(kDate, service);
  const kSigning = await this.hmacsha256(kService, 'tc3_request');
  return kSigning;
}
```

## 5. API Calling

### 5.1 Basic Call

```javascript
// Generate image
aiService.generateImage({
  id: 'unique-id',
  prompt: 'A cute cat',
  parameters: {
    width: 512,
    height: 512,
    steps: 50,
    guidanceScale: 7.5
  }
}).then(imageUrl => {
  console.log('Generated image URL:', imageUrl);
}).catch(error => {
  console.error('Failed to generate image:', error);
});
```

### 5.2 Response Handling

```javascript
// Map API response
const mappedResponse = this.mapHunyuanResponse(response, request);
// Convert to image URL
const imageUrl = this.convertToImageUrl(mappedResponse);
```

## 6. API Parameter Description

### 6.1 Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| Prompt | string | Text description for image generation |
| Resolution | string | Image resolution in "width:height" format |
| Number | integer | Number of images to generate (optional) |

### 6.2 Configuration Parameters

| Parameter | Type | Description | Default Value |
|-----------|------|-------------|---------------|
| width | integer | Image width | 512 |
| height | integer | Image height | 512 |
| steps | integer | Number of generation steps | 50 |
| guidanceScale | float | Guidance scale | 7.5 |
| negativePrompt | string | Negative prompt | Empty |

## 7. Common Issues and Solutions

### 7.1 Signature Error

**Error Message**: `AuthFailure.InvalidAuthorization`

**Solution**:
1. Check if SecretId and SecretKey are correct
2. Ensure the signature generation algorithm matches the Tencent Cloud API documentation
3. Check if the timestamp is correct
4. Ensure the request parameters match those used in signature calculation

### 7.2 Response Timeout

**Error Message**: `Request timeout`

**Solution**:
1. Increase the request timeout
2. Reduce the image resolution
3. Reduce the number of generated images

### 7.3 Parameter Error

**Error Message**: `InvalidParameterValue`

**Solution**:
1. Check if the request parameters meet API requirements
2. Ensure the resolution format is correct
3. Check if the text description meets requirements

## 8. Reference Documentation

- [Tencent Hunyuan API Documentation](https://cloud.tencent.com/document/api/1668/120721)
- [Tencent Cloud API Signature Documentation](https://cloud.tencent.com/document/product/302/10121)

## 9. Notes

1. Please keep your SecretId and SecretKey secure and avoid disclosure
2. Image generation may take some time, please set a reasonable timeout
3. Set image resolution and quantity appropriately according to your business needs to control API call costs
4. Regularly check the API documentation to understand the latest API parameters and features