/****************************************************************************
 Copyright (c) 2010-2013 cocos2d-x.org
 Copyright (c) 2013-2017 Chukong Technologies Inc.
 
 http://www.cocos2d-x.org
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

#import "AppController.h"
#import "cocos2d.h"
#import "AppDelegate.h"
#import "RootViewController.h"
#import <GoogleMobileAds/GoogleMobileAds.h>
#import "GCHelper.h"
#import "InAppPurchaseManager.h"
//#import "scripting/js-bindings/manual/ScriptingCore.h"
#import "XYAlertViewHeader.h"

@implementation AppController

@synthesize window;

#pragma mark -
#pragma mark Application lifecycle

// cocos2d application instance
static AppDelegate s_sharedApplication;

static bool chinese = true;
static AppController *sharedAppController = nil;
+(id)instance{
    return sharedAppController;
}

-(void)callJsEngineCallBack:(NSString*) funcNameStr withContent:(NSString*) contentStr
{
    std::string funcName = [funcNameStr UTF8String];
    std::string param001 = [contentStr UTF8String];
    std::string jsCallStr = cocos2d::StringUtils::format("%s(\"%s\");", funcName.c_str(), param001.c_str());
    NSLog(@"jsCallStr = %s", jsCallStr.c_str());
//    ScriptingCore::getInstance()->evalString(jsCallStr.c_str());
}

#pragma mark -
#pragma mark GameCenter
+(void)showLeaderboard{
    [[GCHelper sharedInstance] showLeaderboard];
}
+(void)commitScore:(NSDictionary *)dict{
    bool relax = false;
    if ([dict objectForKey:@"relax"])
    {
        relax = [[dict objectForKey:@"relax"] boolValue];
    }
    int score = 0;
    if ([dict objectForKey:@"score"])
    {
        score = [[dict objectForKey:@"score"] intValue];
    }
    if(relax)
        [[GCHelper sharedInstance] commitScore:@"tetrisRelaxTopScore" value:score];
    else
        [[GCHelper sharedInstance] commitScore:@"tetrisTopScore" value:score];
}

#pragma mark -
#pragma mark IAP

+(void)testRestoreAds:(NSDictionary *)dict
{
    //测试去除广告
    [[NSUserDefaults standardUserDefaults] setBool:NO forKey:@"isRemoveAdsPurchased" ];
    [[NSUserDefaults standardUserDefaults] synchronize];
}

+(void)removeButton
{
    [[AppController instance] buyRemoveAds];
}
+(void)restoreButton
{
    [[InAppPurchaseManager sharedInstance] restorePay];
}


static XYLoadingView* loadingView = nil;
+(void)connectStore
{
    [[InAppPurchaseManager sharedInstance] requestProducts];


    NSString* msg = @"正在连接...";
    if(!chinese)
        msg = @"Connecting...";
    loadingView = XYShowLoading(msg);
}

-(void)connectedStore:(BOOL)ok
{
    [loadingView dismiss ];
    if(ok)
    {
        [[AppController instance] callJsEngineCallBack:@"showRemoveAds" withContent:@"ok"];
    }
    else
    {
        [[AppController instance] callJsEngineCallBack:@"cantConnect" withContent:@"fail"];
    }
}

-(void)buyRemoveAds
{
    bool canPay = [[InAppPurchaseManager sharedInstance] canMakePurchases];
    if (canPay) {
        //NSLog(@"允许程序内付费购买");
        //[[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
        [[InAppPurchaseManager sharedInstance] purchaseRemoveAds];
    }
    else
    {
        //NSLog(@"不允许程序内付费购买");
        UIAlertView *alerView =  [[UIAlertView alloc] initWithTitle:NSLocalizedString(@"Alert",nil)
                                                            message:NSLocalizedString(@"CANTPURCHASE",nil)
                                                           delegate:nil
                                                  cancelButtonTitle:NSLocalizedString(@"Close",nil)
                                                  otherButtonTitles:nil];
        [alerView show];
        [alerView release];
    }
}
-(void)removeAds
{
    [[NSUserDefaults standardUserDefaults] setBool:YES forKey:@"isRemoveAdsPurchased" ];
    [[NSUserDefaults standardUserDefaults] synchronize];
    isRemovedAds = true;
    [bannerView release];
    //不提示了。。[[AppController instance] luaCallback:successFuncId];
}

#pragma mark -
#pragma mark AD

-(void)initAds
{
    
    // Initialize Google Mobile Ads SDK
    // Sample AdMob app ID: ca-app-pub-3940256099942544~1458002511
    [GADMobileAds configureWithApplicationID:@"ca-app-pub-1261971577301251~7692670128"];
    
    
    CGFloat y = 50;
    if ([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad)
    y = 90;
    int h = [_viewController.view frame].size.height;
    CGPoint origin = CGPointMake(0.0, h-y);
    bannerView = [[GADBannerView alloc]
                       initWithAdSize:kGADAdSizeSmartBannerPortrait
                       origin:origin];
    
    // Replace this ad unit ID with your own ad unit ID.
    bannerView.adUnitID = @"ca-app-pub-1261971577301251/7618618128";
    bannerView.rootViewController = _viewController;
    GADRequest *request = [GADRequest request];
    // Requests test ads on devices you specify. Your test device ID is printed to the console when
    // an ad request is made. GADBannerView automatically returns test ads when running on a
    // simulator.
    request.testDevices = @[ kGADSimulatorID ];
    [_viewController.view addSubview:bannerView];
    [bannerView loadRequest:request];
    
    //启动游戏时的插页
    /*
     GADInterstitial *splashInterstitial_ = [[GADInterstitial alloc] init];
     splashInterstitial_.adUnitID = @"ca-app-pub-6958635682528869/3039047237";
     [splashInterstitial_ loadAndDisplayRequest:[GADRequest request]
     usingWindow:window
     initialImage:[UIImage imageNamed:@"Default.png"]];*/
    
    //[self showInterstitial];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    sharedAppController = self;
    
    cocos2d::Application *app = cocos2d::Application::getInstance();
    
    // Initialize the GLView attributes
    app->initGLContextAttrs();
    cocos2d::GLViewImpl::convertAttrs();
    
    // Override point for customization after application launch.

    // Add the view controller's view to the window and display.
    window = [[UIWindow alloc] initWithFrame: [[UIScreen mainScreen] bounds]];

    // Use RootViewController to manage CCEAGLView
    _viewController = [[RootViewController alloc]init];
    _viewController.wantsFullScreenLayout = YES;
    

    // Set RootViewController to window
    if ( [[UIDevice currentDevice].systemVersion floatValue] < 6.0)
    {
        // warning: addSubView doesn't work on iOS6
        [window addSubview: _viewController.view];
    }
    else
    {
        // use this method on ios6
        [window setRootViewController:_viewController];
    }

    [window makeKeyAndVisible];

    [[UIApplication sharedApplication] setStatusBarHidden:true];
    
    // IMPORTANT: Setting the GLView should be done after creating the RootViewController
    cocos2d::GLView *glview = cocos2d::GLViewImpl::createWithEAGLView((__bridge void *)_viewController.view);
    cocos2d::Director::getInstance()->setOpenGLView(glview);
    
    //run the cocos2d-x game scene
    app->run();

    
    //gamecenter
    [[GCHelper sharedInstance] authenticateLocalUser];
    
    //IAP
    [[InAppPurchaseManager sharedInstance] loadStore];
    
    //AdMob 广告
    isRemovedAds = [[NSUserDefaults standardUserDefaults] boolForKey:@"isRemoveAdsPurchased" ];
    if(!isRemovedAds)
        [self initAds];
    
    return YES;
}


- (void)applicationWillResignActive:(UIApplication *)application {
    /*
     Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
     Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
     */
    // We don't need to call this method any more. It will interrupt user defined game pause&resume logic
    /* cocos2d::Director::getInstance()->pause(); */
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    /*
     Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
     */
    // We don't need to call this method any more. It will interrupt user defined game pause&resume logic
    /* cocos2d::Director::getInstance()->resume(); */
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    /*
     Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later. 
     If your application supports background execution, called instead of applicationWillTerminate: when the user quits.
     */
    cocos2d::Application::getInstance()->applicationDidEnterBackground();
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    /*
     Called as part of  transition from the background to the inactive state: here you can undo many of the changes made on entering the background.
     */
    cocos2d::Application::getInstance()->applicationWillEnterForeground();
}

- (void)applicationWillTerminate:(UIApplication *)application {
    /*
     Called when the application is about to terminate.
     See also applicationDidEnterBackground:.
     */
}


#pragma mark -
#pragma mark Memory management

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {
    /*
     Free up as much memory as possible by purging cached data objects that can be recreated (or reloaded from disk) later.
     */
}


#if __has_feature(objc_arc)
#else
- (void)dealloc {
    [window release];
    [_viewController release];
    [super dealloc];
}
#endif


@end
