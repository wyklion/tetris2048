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
#import "GCHelper.h"
#import "InAppPurchaseManager.h"
//#import "scripting/js-bindings/manual/ScriptingCore.h"
#import "XYAlertViewHeader.h"

#import <ShareSDK/ShareSDK.h>
//Links Native SDK use
#import <ShareSDKConnector/ShareSDKConnector.h>
#import <ShareSDKUI/ShareSDKUI.h>
//QQ SDK header file
#import <TencentOpenAPI/TencentOAuth.h>
#import <TencentOpenAPI/QQApiInterface.h>
//Wechat SDK header file
#import "WXApi.h"
//SinaWeibo SDK header file
#import "WeiboSDK.h"
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
+(void)commitScore:(NSNumber*) score withRelax:(bool )relax{
    int scoreInt = [score intValue];
    if(relax)
        [[GCHelper sharedInstance] commitScore:@"tetrisRelaxTopScore" value:scoreInt];
    else
        [[GCHelper sharedInstance] commitScore:@"tetrisTopScore" value:scoreInt];
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
#pragma mark ShareSDK

+(void)rate{
    //NSString * appstoreUrlString = @"itms-apps://ax.itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?mt=8&onlyLatestVersion=true&pageNumber=0&sortOrdering=1&type=Purple+Software&id=841846341";
//    NSString * appstoreUrlString = @"itms-apps://ax.itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?mt=8&pageNumber=0&sortOrdering=2&type=Purple+Software&id=841846341";
    NSString * appstoreUrlString = @"https://itunes.apple.com/us/app/tetris2048/id875196147?ls=1&mt=8";
    
    NSURL * url = [NSURL URLWithString:appstoreUrlString];
    
    if ([[UIApplication sharedApplication] canOpenURL:url])
    {
        [[UIApplication sharedApplication] openURL:url];
    }
    else
    {
        NSLog(@"can not open");
    }
    [appstoreUrlString release];
}

#pragma mark -
#pragma mark AdMob
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
    
    self.interstitial = [self createAndLoadInterstitial];
}

+(void)showAd{
    [[AppController instance] showInterstitial];
}
-(void)showInterstitial {
    if(isRemovedAds)
        return;
    //NSLog(@"showInterstitial...");
    if ([self.interstitial isReady]) {
        [self.interstitial presentFromRootViewController:_viewController];
    }
}

- (GADInterstitial*)createAndLoadInterstitial {
    GADInterstitial *interstitial =interstitial = [[GADInterstitial alloc] initWithAdUnitID:@"ca-app-pub-1261971577301251/9095351327"];
    interstitial.delegate = self;
    [interstitial loadRequest:[GADRequest request]];
    return interstitial;
}

- (void)interstitialDidReceiveAd:(GADInterstitial *)interstitial {
    //NSLog(@"receiveAd...");
//    [interstitial presentFromRootViewController:_viewController];
}
- (void)interstitial:(GADInterstitial *)interstitial
didFailToReceiveAdWithError:(GADRequestError *)error {
    // Alert the error.
    /*UIAlertView *alert = [[[UIAlertView alloc]
     initWithTitle:@"GADRequestError"
     message:[error localizedDescription]
     delegate:nil cancelButtonTitle:@"Drat"
     otherButtonTitles:nil] autorelease];
     [alert show];*/
}
- (void)interstitialDidDismissScreen:(GADInterstitial *)ad{
    [ad release];
    self.interstitial = [self createAndLoadInterstitial];
}

#pragma mark -
#pragma mark Share

static UIView* ipadShareView = NULL;
-(void)initShare
{
    // 给pad用
    CGSize size = [_viewController.view frame].size;
    CGRect CGone = CGRectMake(size.width*0.7, size.height*0.55, 1, 1);
    ipadShareView = [[UIView alloc]initWithFrame:CGone];//初始化view
    [_viewController.view addSubview:ipadShareView];
    
    [ShareSDK registerActivePlatforms:@[
                                        @(SSDKPlatformTypeFacebook),
                                        @(SSDKPlatformTypeTwitter),
                                        @(SSDKPlatformTypeSinaWeibo),
                                        @(SSDKPlatformTypeWechat),
                                        @(SSDKPlatformTypeQQ)
                                        ]
                             onImport:^(SSDKPlatformType platformType)
     {
         switch (platformType)
         {
             case SSDKPlatformTypeWechat:
                 [ShareSDKConnector connectWeChat:[WXApi class]];
                 break;
             case SSDKPlatformTypeQQ:
                 [ShareSDKConnector connectQQ:[QQApiInterface class] tencentOAuthClass:[TencentOAuth class]];
                 break;
             case SSDKPlatformTypeSinaWeibo:
                 [ShareSDKConnector connectWeibo:[WeiboSDK class]];
                 break;
             default:
                 break;
         }
     }
                      onConfiguration:^(SSDKPlatformType platformType, NSMutableDictionary *appInfo)
     {
         switch (platformType)
         {
             case SSDKPlatformTypeSinaWeibo:
                 //设置新浪微博应用信息,其中authType设置为使用SSO＋Web形式授权
                 [appInfo SSDKSetupSinaWeiboByAppKey:@"1960161340"
                                           appSecret:@"821082da1087d5d55125298e0749af9e"
                                         redirectUri:@"http://weibo.com/wyklion"
                                            authType:SSDKAuthTypeBoth];
                 break;
             case SSDKPlatformTypeWechat:
                 [appInfo SSDKSetupWeChatByAppId:@"wxbdb65b9957734479"
                                       appSecret:@"8da8407de1388b800dafd3974a1331f4"];
                 break;
             case SSDKPlatformTypeQQ:
                 [appInfo SSDKSetupQQByAppId:@"1106468597"
                                      appKey:@"YVKZIZYAtvyIBtD3"
                                    authType:SSDKAuthTypeBoth];
                 break;
             case SSDKPlatformTypeFacebook:
                 [appInfo SSDKSetupFacebookByApiKey:@"796226687054431"
                                          appSecret:@"df38b0ef92743effc7d8c4908b8f5af6"
                                        displayName:@"shareSDK"
                                           authType:SSDKAuthTypeBoth];
                 break;
             case SSDKPlatformTypeTwitter:
                 [appInfo SSDKSetupTwitterByConsumerKey:@"a5X76UcuKV16SKDUxGMbNsFPe"
                                         consumerSecret:@"4rJnu077y50vDyYyUqXKjakEbKXCiUnVdsCN6VutHc9wLk2fVN"
                                            redirectUri:@"http://www.douban.com/people/wyklion"];
                 break;
             default:
                 break;
         }
     }];
}

+(void)share: (NSNumber*) scoreNumber relax: (bool) relax{
    int score = [scoreNumber intValue];
    NSString* strLanguage = [[[NSUserDefaults standardUserDefaults] objectForKey:@"AppleLanguages"] objectAtIndex:0];
    bool chinese = [strLanguage hasPrefix:@"zh"];
    
    //分享界面 选项
    NSString* titleStr = nil;
    if(chinese)
        titleStr = @"俄罗斯方块2048";
    else
        titleStr = @"Number Combo";
    
    //加入分享的图片
    NSString *imagePath = [[NSBundle mainBundle] pathForResource:@"Icon-512"  ofType:@"png"];
    
    //构造分享内容
    NSString* str = nil;
    if(chinese)
    {
        if(relax)
            str = [NSString stringWithFormat:@"我在玩俄罗斯方块2048，休闲模式得分%d。你还不来试试？https://itunes.apple.com/us/app/tetris2048/id875196147?ls=1&mt=8", score];
        else
            str = [NSString stringWithFormat:@"我在玩俄罗斯方块2048，得分%d。你还不来试试？https://itunes.apple.com/us/app/tetris2048/id875196147?ls=1&mt=8", score];
    }
    else
    {
        if(relax)
            str = [NSString stringWithFormat:@"Got %d points in relax mode in Number Combo - Tetris 2048! Have a try？https://itunes.apple.com/us/app/tetris2048/id875196147?ls=1&mt=8", score];
        else
            str = [NSString stringWithFormat:@"Got %d points in Number Combo - Tetris 2048! Have a try？https://itunes.apple.com/us/app/tetris2048/id875196147?ls=1&mt=8", score];
    }
    
    //要分享的列表
    NSArray *shareList = nil;
    if(chinese)
        shareList = @[@(SSDKPlatformSubTypeWechatSession),
                      @(SSDKPlatformSubTypeWechatTimeline),
                      @(SSDKPlatformTypeSinaWeibo),
                      @(SSDKPlatformSubTypeQQFriend),
                      @(SSDKPlatformTypeFacebook),
                      @(SSDKPlatformTypeTwitter)];
    else
        shareList = @[@(SSDKPlatformTypeFacebook),
                      @(SSDKPlatformTypeTwitter),
                      @(SSDKPlatformSubTypeWechatSession),
                      @(SSDKPlatformSubTypeWechatTimeline),
                      @(SSDKPlatformTypeSinaWeibo)];
    
    //1、创建分享参数
    NSArray* imageArray = @[[UIImage imageNamed:imagePath]];
    if (imageArray) {
        NSMutableDictionary *shareParams = [NSMutableDictionary dictionary];
        [shareParams SSDKSetupShareParamsByText:str
                                         images:imageArray
                                            url:[NSURL URLWithString:@"https://itunes.apple.com/us/app/tetris2048/id875196147?ls=1&mt=8"]
                                          title:titleStr
                                           type:SSDKContentTypeAuto];
        //2、分享（可以弹出我们的分享菜单和编辑界面）
        [ShareSDK showShareActionSheet:ipadShareView //要显示菜单的视图, iPad版中此参数作为弹出菜单的参照视图，只有传这个才可以弹出我们的分享菜单，可以传分享的按钮对象或者自己创建小的view 对象，iPhone可以传nil不会影响
                                 items:shareList
                           shareParams:shareParams
                   onShareStateChanged:^(SSDKResponseState state, SSDKPlatformType platformType, NSDictionary *userData, SSDKContentEntity *contentEntity, NSError *error, BOOL end) {
                       switch (state) {
                           case SSDKResponseStateSuccess:
                           {
                               UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:(chinese ? @"分享成功" : @"Success")
                                                                                   message:nil
                                                                                  delegate:nil
                                                                         cancelButtonTitle:(chinese ? @"确定" : @"OK")
                                                                         otherButtonTitles:nil];
                               [alertView show];
                               break;
                           }
                           case SSDKResponseStateFail:
                           {
                               UIAlertView *alert = [[UIAlertView alloc] initWithTitle:(chinese ? @"分享失败" : @"Failed")
                                                                               message:[NSString stringWithFormat:@"%@",error]
                                                                              delegate:nil
                                                                     cancelButtonTitle:(chinese ? @"确定" : @"OK")
                                                                     otherButtonTitles:nil, nil];
                               [alert show];
                               break;
                           }
                           default:
                               break;
                       }
                   }];
    }
                       
//    //分享的 底ViewControoler
//    id<ISSContainer> container = [ShareSDK container];
//
//    //可以 设置 sharesdk 弹出的底ViewController
//    //[container setIPhoneContainerWithViewController:nil];
//    [container setIPadContainerWithView:ipadShareView arrowDirect:UIPopoverArrowDirectionDown];
//
//    //自动授权
//    id<ISSAuthOptions> authOptions = [ShareSDK authOptionsWithAutoAuth:YES
//                                                         allowCallback:NO
//                                                         authViewStyle:SSAuthViewStyleModal
//                                                          viewDelegate:nil
//                                               authManagerViewDelegate:nil];
//
//
//    id<ISSShareOptions> shareOptions = [ShareSDK defaultShareOptionsWithTitle:titleStr
//                                                              oneKeyShareList:shareList
//                                                               qqButtonHidden:YES
//                                                        wxSessionButtonHidden:NO
//                                                       wxTimelineButtonHidden:NO
//                                                         showKeyboardOnAppear:NO
//                                                            shareViewDelegate:nil
//                                                          friendsViewDelegate:nil
//                                                        picViewerViewDelegate:nil];
//
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
    
    //分享
    [self initShare];
    
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
