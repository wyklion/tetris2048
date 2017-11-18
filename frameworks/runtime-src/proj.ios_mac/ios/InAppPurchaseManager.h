//
//  InAppPurchaseManager.h
//  2048
//
//  Created by KK on 14-3-27.
//
//


#import <StoreKit/StoreKit.h>
#import <Foundation/Foundation.h>

#define kInAppPurchaseManagerProductsFetchedNotification @"kInAppPurchaseManagerProductsFetchedNotification"
#define kInAppPurchaseManagerTransactionFailedNotification @"kInAppPurchaseManagerTransactionFailedNotification"
#define kInAppPurchaseManagerTransactionSucceededNotification @"kInAppPurchaseManagerTransactionSucceededNotification"

/*
@interface SKProduct (LocalizedPrice)
@property (nonatomic, readonly) NSString *localizedPrice;
@end*/

@interface InAppPurchaseManager : NSObject <SKProductsRequestDelegate, SKPaymentTransactionObserver>
{
    SKProductsRequest *productsRequest;
    SKProduct* removeAdsProduct;
}
// public methods
+ (InAppPurchaseManager *)sharedInstance;

-(void)restorePay;
- (void)loadStore;
- (void)requestProducts;
- (BOOL)canMakePurchases;
- (void)purchaseRemoveAds;

@end
