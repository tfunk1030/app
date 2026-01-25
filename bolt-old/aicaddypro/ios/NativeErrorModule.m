#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(NativeErrorModule, RCTEventEmitter)
RCT_EXTERN_METHOD(install)
RCT_EXTERN_METHOD(supportedEvents)
@end
