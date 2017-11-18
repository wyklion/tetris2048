//
//  GCHelper.h
//  WatermelonChess
//
//  Created by 王奕凯 on 4/13/13.
//
//

#import <UIKit/UIKit.h>
#import<Foundation/Foundation.h>
#import<GameKit/GameKit.h>

@protocol GCHelperDelegate
-(void)matchCancel;
- (void)matchStarted;
- (void)matchEnded;
- (void)match:(GKMatch *)match didReceiveData:(NSData *)data
   fromPlayer:(NSString *)playerID;
- (void)inviteReceived;
@end
/*
class GCHelperDelegate
{
    void matchStarted();
    void matchEnded();
    GKMatch* didReceiveDataFromPlay(NSData* data, NSString* playerID);
};
 
 */
@interface GCHelper : NSObject <GKLeaderboardViewControllerDelegate, GKAchievementViewControllerDelegate, GKMatchmakerViewControllerDelegate, GKMatchDelegate>{
    BOOL gameCenterAvailable;
    BOOL userAuthenticated;
    
    UIViewController *presentingViewController;
    GKMatch *match;
    BOOL matchStarted;
    id<GCHelperDelegate>delegate;
    NSMutableDictionary *playersDict;
    GKInvite *pendingInvite;
    NSArray *pendingPlayersToInvite;
}

@property (assign, readonly) BOOL gameCenterAvailable;
@property (retain) UIViewController *presentingViewController;
@property (retain) GKMatch *match;
@property (assign) id<GCHelperDelegate>delegate;
@property (retain) NSMutableDictionary *playersDict;
@property (retain) GKInvite *pendingInvite;
@property (retain) NSArray *pendingPlayersToInvite;

+ (GCHelper *)sharedInstance;
- (void)authenticateLocalUser;
- (void) showLeaderboard;
- (void) showAchivement;
- (void)leaderboardViewControllerDidFinish:(GKLeaderboardViewController *)viewController;
- (void)achievementViewControllerDidFinish:(GKAchievementViewController *)viewController;

- (void)commitAchievement:(NSString*)acid value:(int)value;
- (void)commitScore:(NSString*)scoreId value:(int)value;
- (void)commitAddScore:(NSString*)scoreId value:(int)value;

- (void)findMatchWithMinPlayers:(int)minPlayers maxPlayers:(int)maxPlayers
                       viewController:(UIViewController *)viewController
                       delegate:(id<GCHelperDelegate>)theDelegate;
@end


