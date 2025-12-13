// 文件名: tc3-signature.ts
import * as crypto from 'crypto';

export class TC3Signature {
    /**
     * 生成TC3-HMAC-SHA256签名
     */
    static generateSignature(
        secretKey: string,
        service: string,
        timestamp: number,
        canonicalRequest: string
    ): string {
        const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
        const credentialScope = `${date}/${service}/tc3_request`;
        
        // 1. 派生签名密钥
        const signingKey = this.deriveSigningKey(secretKey, date, service);
        
        // 2. 计算签名
        const stringToSign = this.buildStringToSign(timestamp, credentialScope, canonicalRequest);
        const signature = crypto.createHmac('sha256', signingKey)
            .update(stringToSign)
            .digest('hex');
            
        return signature;
    }
    
    /**
     * 派生签名密钥（关键步骤）
     */
    private static deriveSigningKey(secretKey: string, date: string, service: string): Buffer {
        const kDate = crypto.createHmac('sha256', 'TC3' + secretKey)
            .update(date)
            .digest();
            
        const kService = crypto.createHmac('sha256', kDate)
            .update(service)
            .digest();
            
        const kSigning = crypto.createHmac('sha256', kService)
            .update('tc3_request')
            .digest();
            
        return kSigning;
    }
    
    /**
     * 构建签名字符串
     */
    private static buildStringToSign(timestamp: number, credentialScope: string, canonicalRequest: string): string {
        const hashedRequest = crypto.createHash('sha256')
            .update(canonicalRequest)
            .digest('hex');
            
        return [
            'TC3-HMAC-SHA256',
            timestamp.toString(),
            credentialScope,
            hashedRequest
        ].join('\n');
    }
    
    /**
     * 构建规范请求
     */
    static buildCanonicalRequest(
        method: string,
        path: string,
        query: string,
        headers: Record<string, string>,
        signedHeaders: string[],
        payload: string
    ): string {
        // 1. HTTP方法
        const httpMethod = method.toUpperCase();
        
        // 2. 规范URI（URL编码）
        const canonicalUri = encodeURIComponent(path).replace(/%2F/g, '/');
        
        // 3. 规范查询字符串（排序后编码）
        const canonicalQueryString = this.buildCanonicalQueryString(query);
        
        // 4. 规范头部（小写、排序、去除空格）
        const canonicalHeaders = this.buildCanonicalHeaders(headers, signedHeaders);
        
        // 5. 签名头部列表（小写、排序、分号分隔）
        const signedHeadersString = signedHeaders.map(h => h.toLowerCase()).sort().join(';');
        
        // 6. 请求体哈希（SHA256）
        const hashedPayload = crypto.createHash('sha256').update(payload).digest('hex');
        
        return [
            httpMethod,
            canonicalUri,
            canonicalQueryString,
            canonicalHeaders,
            signedHeadersString,
            hashedPayload
        ].join('\n');
    }
    
    /**
     * 构建规范查询字符串
     */
    private static buildCanonicalQueryString(query: string): string {
        if (!query) return '';
        
        const params = new URLSearchParams(query);
        const sortedParams = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => {
                const encodedKey = encodeURIComponent(key);
                const encodedValue = encodeURIComponent(value);
                return `${encodedKey}=${encodedValue}`;
            });
            
        return sortedParams.join('&');
    }
    
    /**
     * 构建规范头部
     */
    private static buildCanonicalHeaders(headers: Record<string, string>, signedHeaders: string[]): string {
        const headerMap: Record<string, string> = {};
        
        // 处理头部（小写、去除前后空格）
        for (const [key, value] of Object.entries(headers)) {
            const lowerKey = key.toLowerCase();
            headerMap[lowerKey] = value.trim().replace(/\s+/g, ' ');
        }
        
        // 只包含签名头部，按字母排序
        const canonicalHeaders = signedHeaders
            .map(h => h.toLowerCase())
            .sort()
            .map(header => `${header}:${headerMap[header]}`)
            .join('\n');
            
        return canonicalHeaders + '\n';
    }
    
    /**
     * 生成完整的Authorization头
     */
    static generateAuthorizationHeader(
        secretId: string,
        secretKey: string,
        service: string,
        timestamp: number,
        canonicalRequest: string
    ): string {
        const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
        const credentialScope = `${date}/${service}/tc3_request`;
        
        const signature = this.generateSignature(secretKey, service, timestamp, canonicalRequest);
        
        return `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, ` +
               `SignedHeaders=content-type;host, Signature=${signature}`;
    }
}