"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface WalletStatus {
  wallet: {
    apple: { configured: boolean };
    google: { configured: boolean };
    anyConfigured: boolean;
  };
  envCheck: {
    googleCredentialsPath?: string;
    googleIssuerId?: string;
    appleEnabled?: string;
    applePassTypeId: string;
    appleTeamId: string;
    appleApnsKeyId: string;
    appleApnsKeyPath: string;
    appleApnsEnv: string;
  };
}

export default function WalletDebugPage() {
  const [status, setStatus] = useState<WalletStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/loyalty/wallet/status");
      const data = await res.json();
      
      if (data.ok) {
        setStatus(data);
      } else {
        setError(data.error || "Failed to fetch status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const StatusIcon = ({ value }: { value: boolean | string }) => {
    const isOk = value === true || value === "✓";
    return isOk ? (
      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) : (
      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallet Configuration Debug</h1>
          <p className="text-muted-foreground mt-1">
            Check wallet update system status and configuration
          </p>
        </div>
        <Button onClick={fetchStatus} disabled={loading}>
          <svg className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !status && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <svg className="h-6 w-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Loading status...
            </div>
          </CardContent>
        </Card>
      )}

      {status && (
        <>
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Status</CardTitle>
              <CardDescription>Current wallet provider configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">At least one provider configured</span>
                  {status.wallet.anyConfigured ? (
                    <Badge className="bg-green-600">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Apple Wallet Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Apple Wallet (APNs)
                <StatusIcon value={status.wallet.apple.configured} />
              </CardTitle>
              <CardDescription>Push notification configuration for Apple Wallet updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="text-sm">Enabled</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {status.envCheck.appleEnabled || "false"}
                    </code>
                    <StatusIcon value={status.envCheck.appleEnabled === "true"} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="text-sm">Pass Type ID</span>
                  <StatusIcon value={status.envCheck.applePassTypeId} />
                </div>
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="text-sm">Team ID</span>
                  <StatusIcon value={status.envCheck.appleTeamId} />
                </div>
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="text-sm">APNs Key ID</span>
                  <StatusIcon value={status.envCheck.appleApnsKeyId} />
                </div>
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="text-sm">APNs Auth Key (P8)</span>
                  <StatusIcon value={status.envCheck.appleApnsKeyPath} />
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm">Environment</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {status.envCheck.appleApnsEnv}
                  </code>
                </div>
              </div>

              {!status.wallet.apple.configured && (
                <Alert className="mt-4">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <AlertTitle>Configuration Required</AlertTitle>
                  <AlertDescription className="text-xs mt-2 space-y-1">
                    <p>Set these environment variables:</p>
                    <code className="block bg-muted p-2 rounded mt-2">
                      APPLE_WALLET_ENABLED=true<br />
                      APPLE_PASS_TYPE_ID=pass.com.yourcompany.loyalty<br />
                      APPLE_TEAM_ID=XXXXXXXXXX<br />
                      APPLE_APNS_KEY_ID=YYYYYYYYYY<br />
                      APPLE_APNS_AUTH_KEY_P8_PATH=/path/to/key.p8
                    </code>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Google Wallet Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Google Wallet
                <StatusIcon value={status.wallet.google.configured} />
              </CardTitle>
              <CardDescription>API configuration for Google Wallet pass updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="text-sm">Credentials File</span>
                  <div className="flex items-center gap-2">
                    {status.envCheck.googleCredentialsPath && (
                      <code className="text-xs bg-muted px-2 py-1 rounded max-w-xs truncate">
                        {status.envCheck.googleCredentialsPath}
                      </code>
                    )}
                    <StatusIcon value={Boolean(status.envCheck.googleCredentialsPath)} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-2">
                  <span className="text-sm">Issuer ID</span>
                  <div className="flex items-center gap-2">
                    {status.envCheck.googleIssuerId && (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {status.envCheck.googleIssuerId}
                      </code>
                    )}
                    <StatusIcon value={Boolean(status.envCheck.googleIssuerId)} />
                  </div>
                </div>
              </div>

              {!status.wallet.google.configured && (
                <Alert className="mt-4">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <AlertTitle>Configuration Required</AlertTitle>
                  <AlertDescription className="text-xs mt-2 space-y-1">
                    <p>Set these environment variables:</p>
                    <code className="block bg-muted p-2 rounded mt-2">
                      GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json<br />
                      GOOGLE_WALLET_ISSUER_ID=your-issuer-id
                    </code>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Testing Wallet Updates</CardTitle>
              <CardDescription>How to verify wallet updates are working</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">1. Check Configuration</h4>
                  <p className="text-muted-foreground">
                    Ensure at least one wallet provider (Apple or Google) is properly configured above.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">2. Test with Script</h4>
                  <p className="text-muted-foreground mb-2">Run the test script:</p>
                  <code className="block bg-muted p-2 rounded">
                    node scripts/test-wallet-update.js [cardId] [points]
                  </code>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3. Test via API</h4>
                  <p className="text-muted-foreground mb-2">
                    Add or redeem points for a customer and check the API response for wallet update results.
                  </p>
                  <code className="block bg-muted p-2 rounded text-xs">
                    PATCH /api/loyalty/customers/[id]/points<br />
                    POST /api/loyalty/customers/[id]/redeem
                  </code>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">4. Verify on Device</h4>
                  <p className="text-muted-foreground">
                    Check the customer&apos;s mobile wallet app to confirm the pass updates with new points.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
