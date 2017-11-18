//
//  GCHelper.m
//  WatermelonChess
//
//  Created by 王奕凯 on 4/13/13.
//
//

#import "GCHelper.h"

@implementation GCHelper

@synthesize gameCenterAvailable;
@synthesize presentingViewController;
@synthesize match;
@synthesize delegate;
@synthesize playersDict;
@synthesize pendingInvite;
@synthesize pendingPlayersToInvite;

#pragma mark Initialization

static GCHelper *sharedHelper = nil;
static UIViewController* currentModalViewController = nil;

+ (GCHelper *) sharedInstance {
    if (!sharedHelper) {
        sharedHelper = [[GCHelper alloc] init];
    }
    return sharedHelper;
}

- (BOOL)isGameCenterAvailable {
    // check for presence of GKLocalPlayer API
    Class gcClass = (NSClassFromString(@"GKLocalPlayer"));
    
    // check if the device is running iOS 4.1 or later
    NSString *reqSysVer =@"4.1";
    NSString *currSysVer = [[UIDevice currentDevice] systemVersion];
    BOOL osVersionSupported = ([currSysVer compare:reqSysVer
                                           options:NSNumericSearch] != NSOrderedAscending);
    
    return (gcClass && osVersionSupported);
}

- (id)init {
    if ((self = [super init])) {
        gameCenterAvailable = [self isGameCenterAvailable];
        if (gameCenterAvailable) {
            NSNotificationCenter *nc =
            [NSNotificationCenter defaultCenter];
            [nc addObserver:self
                   selector:@selector(authenticationChanged)
                       name:GKPlayerAuthenticationDidChangeNotificationName
                     object:nil];
        }
    }
    return self;
}

- (void)authenticationChanged {
    
    if ([GKLocalPlayer localPlayer].isAuthenticated &&!userAuthenticated)
    {
        NSLog(@"id: %@", [GKLocalPlayer localPlayer].playerID);
        NSLog(@"Authentication changed: player authenticated.");
        userAuthenticated = TRUE;
        [GKMatchmaker sharedMatchmaker].inviteHandler =^(GKInvite *acceptedInvite, NSArray *playersToInvite) {
            
            NSLog(@"Received invite");
            self.pendingInvite = acceptedInvite;
            self.pendingPlayersToInvite = playersToInvite;
            [delegate inviteReceived];
            
        };
    }
    else if(![GKLocalPlayer localPlayer].isAuthenticated && userAuthenticated)
    {
        NSLog(@"Authentication changed: player not authenticated");
        userAuthenticated = FALSE;
    }
    
}

#pragma mark User functions

- (void)authenticateLocalUser {
    
    if (!gameCenterAvailable) return;
    
    NSLog(@"Authenticating local user...");
    if ([GKLocalPlayer localPlayer].authenticated == NO)
    {/*
        // check if the device is running iOS 4.1 or later
        NSString *reqSysVer =@"6.0";
        NSString *currSysVer = [[UIDevice currentDevice] systemVersion];
        BOOL newVersion = ([currSysVer compare:reqSysVer
                                               options:NSNumericSearch] != NSOrderedAscending);
        if(newVersion)
            [[GKLocalPlayer localPlayer] authenticateHandler];
        else*/
            [[GKLocalPlayer localPlayer] authenticateWithCompletionHandler:nil];
    }
    else
    {
        NSLog(@"Already authenticated!");
    }
}

//显示排行榜
- (void) showLeaderboard
{
    if (!gameCenterAvailable) return;
    
    GKLeaderboardViewController *leaderboardController = [[GKLeaderboardViewController alloc] init];
    if (leaderboardController != nil) {
        leaderboardController.leaderboardDelegate = self;
        
        UIWindow *window = [[UIApplication sharedApplication] keyWindow];
        currentModalViewController = [[UIViewController alloc] init];
        [window addSubview:currentModalViewController.view];
        [currentModalViewController presentModalViewController:leaderboardController animated:YES];
    }
}

- (void) showAchivement
{
    if (!gameCenterAvailable) return;
    
    GKAchievementViewController *achievementController = [[GKAchievementViewController alloc] init];
    if (achievementController != nil) {
        achievementController.achievementDelegate = self;
        
        UIWindow *window = [[UIApplication sharedApplication] keyWindow];
        currentModalViewController = [[UIViewController alloc] init];
        [window addSubview:currentModalViewController.view];
        [currentModalViewController presentModalViewController:achievementController animated:YES];
    }
}

//关闭排行榜回调
- (void)leaderboardViewControllerDidFinish:(GKLeaderboardViewController *)viewController{
    if(currentModalViewController !=nil){
        [currentModalViewController dismissModalViewControllerAnimated:NO];
        [currentModalViewController release];
        [currentModalViewController.view removeFromSuperview];
        currentModalViewController = nil;
    }
}

- (void)achievementViewControllerDidFinish:(GKAchievementViewController *)viewController{
    if(currentModalViewController !=nil){
        [currentModalViewController dismissModalViewControllerAnimated:NO];
        [currentModalViewController release];
        [currentModalViewController.view removeFromSuperview];
        currentModalViewController = nil;
    }    
}

- (void)commitAchievement:(NSString*)acid value:(int)value
{
    if (!gameCenterAvailable) return;
    GKAchievement* ac = [[GKAchievement alloc] initWithIdentifier:acid];
    ac.percentComplete = value;
    [ac reportAchievementWithCompletionHandler:^(NSError* error){
       if(error)
       {
           
       }
    }];
}

- (void)commitScore:(NSString*)scoreId value:(int)value
{
    if (!gameCenterAvailable) return;
    GKScore* score = [[GKScore alloc] initWithCategory:scoreId];
    score.value = value;
    [score reportScoreWithCompletionHandler:^(NSError* error){
        if(error)
        {
            
        }
    }];
    
}

- (void)commitAddScore:(NSString*)scoreId value:(int)value
{
    if (!gameCenterAvailable) return;
    GKScore* score = [[GKScore alloc] initWithCategory:scoreId];
    score.value += value;
    [score reportScoreWithCompletionHandler:^(NSError* error){
        if(error)
        {
            
        }
    }];
    
}

- (void)findMatchWithMinPlayers:(int)minPlayers maxPlayers:(int)maxPlayers
                 viewController:(UIViewController *)viewController
                       delegate:(id<GCHelperDelegate>)theDelegate {
    
    if (!gameCenterAvailable) return;
    
    matchStarted = NO;
    self.match = nil;
    self.presentingViewController = viewController;
    delegate= theDelegate;
    if (pendingInvite != nil)
    {        
        [presentingViewController dismissModalViewControllerAnimated:NO];
        GKMatchmakerViewController *mmvc = [[[GKMatchmakerViewController alloc] initWithInvite:pendingInvite] autorelease];
        mmvc.matchmakerDelegate = self;
        [presentingViewController presentModalViewController:mmvc animated:YES];
        
        self.pendingInvite = nil;
        self.pendingPlayersToInvite = nil;
        
    }
    else
    {
        [presentingViewController dismissModalViewControllerAnimated:NO];
        GKMatchRequest *request = [[[GKMatchRequest alloc] init] autorelease];
        request.minPlayers = minPlayers;
        request.maxPlayers = maxPlayers;
        request.playersToInvite = pendingPlayersToInvite;
        GKMatchmakerViewController *mmvc =
        [[[GKMatchmakerViewController alloc] initWithMatchRequest:request] autorelease];
        mmvc.matchmakerDelegate = self;
        [presentingViewController presentModalViewController:mmvc animated:YES];
        
        self.pendingInvite = nil;
        self.pendingPlayersToInvite = nil;
    }
}

#pragma mark GKMatchmakerViewControllerDelegate

// The user has cancelled matchmaking
- (void)matchmakerViewControllerWasCancelled:(GKMatchmakerViewController *)viewController {
    [presentingViewController dismissModalViewControllerAnimated:YES];
    NSLog(@"match cancel...");
    [delegate matchCancel];
}

// Matchmaking has failed with an error
- (void)matchmakerViewController:(GKMatchmakerViewController *)viewController didFailWithError:(NSError *)error {
    [presentingViewController dismissModalViewControllerAnimated:YES];
    NSLog(@"Error finding match: %@", error.localizedDescription);
}

// A peer-to-peer match has been found, the game should start
- (void)matchmakerViewController:(GKMatchmakerViewController *)viewController didFindMatch:(GKMatch *)theMatch {
    [presentingViewController dismissViewControllerAnimated:YES completion:nil];
    self.match = theMatch;
    match.delegate= self;
    if (!matchStarted && match.expectedPlayerCount ==0) {
        NSLog(@"Ready to start match!");
        [self lookupPlayers];
    }
}

#pragma mark GKMatchDelegate

// The match received data sent from the player.
- (void)match:(GKMatch *)theMatch didReceiveData:(NSData *)data fromPlayer:(NSString *)playerID {
    if (match != theMatch) return;
    
    [delegate match:theMatch didReceiveData:data fromPlayer:playerID];
}

// The player state changed (eg. connected or disconnected)
- (void)match:(GKMatch *)theMatch player:(NSString *)playerID didChangeState:(GKPlayerConnectionState)state {
    if (match != theMatch) return;
    
    switch (state) {
        case GKPlayerStateConnected:
            // handle a new player connection.
            NSLog(@"Player connected!");
            
            if (!matchStarted && theMatch.expectedPlayerCount ==0) {
                NSLog(@"Ready to start match!");
                [self lookupPlayers];
            }
            
            break;
        case GKPlayerStateDisconnected:
            // a player just disconnected.
            NSLog(@"Player disconnected!");
            matchStarted = NO;
            [delegate matchEnded];
            break;
    }
}

// The match was unable to connect with the player due to an error.
- (void)match:(GKMatch *)theMatch connectionWithPlayerFailed:(NSString *)playerID withError:(NSError *)error {
    
    if (match != theMatch) return;
    
    NSLog(@"Failed to connect to player with error: %@", error.localizedDescription);
    matchStarted = NO;
    [delegate matchEnded];
}

// The match was unable to be established with any players due to an error.
- (void)match:(GKMatch *)theMatch didFailWithError:(NSError *)error {
    
    if (match != theMatch) return;
    
    NSLog(@"Match failed with error: %@", error.localizedDescription);
    matchStarted = NO;
    [delegate matchEnded];
}

- (void)lookupPlayers {
    
    NSLog(@"Looking up %d players...", match.playerIDs.count);
    [GKPlayer loadPlayersForIdentifiers:match.playerIDs withCompletionHandler:^(NSArray *players, NSError *error) {
        
        if (error != nil) {
            NSLog(@"Error retrieving player info: %@", error.localizedDescription);
            matchStarted = NO;
            [delegate matchEnded];
        } else {
            
            // Populate players dict
            self.playersDict = [NSMutableDictionary dictionaryWithCapacity:players.count];
            for (GKPlayer *player in players) {
                NSLog(@"Found player: %@", player.alias);
                [playersDict setObject:player forKey:player.playerID];
            }
            // Notify delegate match can begin
            matchStarted = YES;
            [delegate matchStarted];
            
        }
    }];
    
}

@end