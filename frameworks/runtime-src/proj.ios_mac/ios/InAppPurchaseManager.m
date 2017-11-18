//
//  InAppPurchaseManager.m
//  2048
//
//  Created by KK on 14-3-27.
//
//
#import "AppController.h"
#import "InAppPurchaseManager.h"

#define kInAppPurchaseRemoveAdsProductId @"tetris2048.removeAds"

/*
@implementation SKProduct (LocalizedPrice)
- (NSString *)localizedPrice
{
    NSNumberFormatter *numberFormatter = [[NSNumberFormatter alloc] init];
    [numberFormatter setFormatterBehavior:NSNumberFormatterBehavior10_4];
    [numberFormatter setNumberStyle:NSNumberFormatterCurrencyStyle];
    [numberFormatter setLocale:self.priceLocale];
    NSString *formattedString = [numberFormatter stringFromNumber:self.price];
    [numberFormatter release];
    return formattedString;
}
@end*/

@implementation InAppPurchaseManager

static InAppPurchaseManager *sharedIapManager = nil;
+ (InAppPurchaseManager *) sharedInstance {
    if (!sharedIapManager) {
        sharedIapManager = [[InAppPurchaseManager alloc] init];
    }
    return sharedIapManager;
}

-(void)restorePay{
    [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
    
}

// InAppPurchaseManager.m
- (void)requestProducts
{
    NSSet *productIdentifiers = [NSSet setWithObject:[NSString stringWithFormat:kInAppPurchaseRemoveAdsProductId]];
    productsRequest = [[SKProductsRequest alloc] initWithProductIdentifiers:productIdentifiers];
    productsRequest.delegate = self;
    [productsRequest start];
}

#pragma mark -
#pragma mark SKProductsRequestDelegate methods
- (void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response
{
    
    NSArray *products = response.products;
    removeAdsProduct = [products count] == 1 ? [[products firstObject] retain] : nil;
    /*
    if (removeAdsProduct)
    {
        NSLog(@"Product title: %@" , removeAdsProduct.localizedTitle);
        NSLog(@"Product description: %@" , removeAdsProduct.localizedDescription);
        NSLog(@"Product price: %@" , removeAdsProduct.price);
        NSLog(@"Product id: %@" , removeAdsProduct.productIdentifier);
    }
    
    for (NSString *invalidProductId in response.invalidProductIdentifiers)
    {
        NSLog(@"Invalid product id: %@" , invalidProductId);
    }*/
    
    // finally release the reqest we alloc/init’ed in requestProUpgradeProductData
    [productsRequest release];
    
    [[AppController instance] connectedStore:YES];
    [[NSNotificationCenter defaultCenter] postNotificationName:kInAppPurchaseManagerProductsFetchedNotification object:self userInfo:nil];
}


- (void)purchaseRemoveAds
{
    SKPayment *payment = [SKPayment paymentWithProduct:removeAdsProduct];
    [[SKPaymentQueue defaultQueue] addPayment:payment];
}


//弹出错误信息
- (void)request:(SKRequest *)request didFailWithError:(NSError *)error{
    /*NSLog(@"-------弹出错误信息----------");
    UIAlertView *alerView =  [[UIAlertView alloc] initWithTitle:NSLocalizedString(@"Alert",NULL) message:[error localizedDescription]
                                                       delegate:nil cancelButtonTitle:NSLocalizedString(@"Close",nil) otherButtonTitles:nil];
    [alerView show];
    [alerView release];*/
    [[AppController instance] connectedStore:NO];
}

#pragma -
#pragma Public methods
//
// call this method once on startup
//
- (void)loadStore
{
    // restarts any purchases if they were interrupted last time the app was open
    [[SKPaymentQueue defaultQueue] addTransactionObserver:self];
    
    // get the product description (defined in early sections)
    //[self requestProducts];
}
//
// call this before making a purchase
//
- (BOOL)canMakePurchases
{
    return [SKPaymentQueue canMakePayments];
}
//
// kick off the upgrade transaction
//
#pragma -
#pragma Purchase helpers
//
// saves a record of the transaction by storing the receipt to disk
//
- (void)recordTransaction:(SKPaymentTransaction *)transaction
{
    
    if ([transaction.payment.productIdentifier isEqualToString:kInAppPurchaseRemoveAdsProductId])
    {
        // save the transaction receipt to disk
        [[NSUserDefaults standardUserDefaults] setValue:transaction.transactionReceipt forKey:@"removeAdsTransactionReceipt" ];
        [[NSUserDefaults standardUserDefaults] synchronize];
    }
}
//
// enable pro features
//
- (void)provideContent:(NSString *)productId
{
    if ([productId isEqualToString:kInAppPurchaseRemoveAdsProductId])
    {
        // enable the pro features
        [[AppController instance] removeAds];
    }
}
//
// removes the transaction from the queue and posts a notification with the transaction result
//

- (void)finishTransaction:(SKPaymentTransaction *)transaction wasSuccessful:(BOOL)wasSuccessful
{
    // remove the transaction from the payment queue.
    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
    
    NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:transaction, @"transaction" , nil];
    if (wasSuccessful)
    {
        // send out a notification that we’ve finished the transaction
        [[NSNotificationCenter defaultCenter] postNotificationName:kInAppPurchaseManagerTransactionSucceededNotification object:self userInfo:userInfo];
    }
    else
    {
        // send out a notification for the failed transaction
        [[NSNotificationCenter defaultCenter] postNotificationName:kInAppPurchaseManagerTransactionFailedNotification object:self userInfo:userInfo];
    }
}
//
// called when the transaction was successful
//
- (void)completeTransaction:(SKPaymentTransaction *)transaction
{
    [self recordTransaction:transaction];
    [self provideContent:transaction.payment.productIdentifier];
    [self finishTransaction:transaction wasSuccessful:YES];
}
//
// called when a transaction has been restored and and successfully completed
//
- (void)restoreTransaction:(SKPaymentTransaction *)transaction
{
    [self recordTransaction:transaction.originalTransaction];
    [self provideContent:transaction.originalTransaction.payment.productIdentifier];
    [self finishTransaction:transaction wasSuccessful:YES];
}
//
// called when a transaction has failed
//
- (void)failedTransaction:(SKPaymentTransaction *)transaction
{
    if (transaction.error.code != SKErrorPaymentCancelled)
    {
        // error!
        [self finishTransaction:transaction wasSuccessful:NO];
    }
    else
    {
        // this is fine, the user just cancelled, so don’t notify
        [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
    }
}
#pragma mark -
#pragma mark SKPaymentTransactionObserver methods
//
// called when the transaction status is updated
//
- (void)paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray *)transactions
{
    for (SKPaymentTransaction *transaction in transactions)
    {
        switch (transaction.transactionState)
        {
            case SKPaymentTransactionStatePurchased:
                [self completeTransaction:transaction];
                break;
            case SKPaymentTransactionStateFailed:
                [self failedTransaction:transaction];
                break;
            case SKPaymentTransactionStateRestored:
                [self restoreTransaction:transaction];
                break;
            default:
                break;
        }
    }
}

@end