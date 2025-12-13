// Declare global angular variable
declare const angular: any;

describe('AIService', () => {  let AIService: any;
  
  // Load the module before each test
  beforeEach(angular.mock.module('creationImageApp'));
  
  // Inject the service before each test
  beforeEach(angular.mock.inject((_AIService_: any) => {
    AIService = _AIService_;
  }));
  
  // Test if service exists
  it('should exist', () => {
    expect(AIService).toBeDefined();
  });
  
  // Test generateImage method
  it('should generate an image URL with the provided prompt and style', (done) => {
    const prompt = '测试图像';
    const style = 'cartoon';
    
    AIService.generateImage(prompt, style)
      .then((imageUrl: string) => {
        expect(imageUrl).toContain('测试图像');
        expect(imageUrl).toContain('cartoon');
        done();
      })
      .catch((error: any) => {
        done.fail(error);
      });
  });
  
  // Test asynchronous behavior of generateImage method
  it('should return a Promise', () => {
    const result = AIService.generateImage('test', 'realistic');
    expect(result).toBeDefined();
    expect(typeof result.then).toBe('function');
  });
});
