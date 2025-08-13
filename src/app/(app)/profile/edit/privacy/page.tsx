import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacySettingsPage() {
    return (
        <div className="container mx-auto max-w-3xl p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Gizlilik ve İzinler</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Bu sayfada gizlilik ve izin ayarlarınızı düzenleyebilirsiniz.</p>
                </CardContent>
            </Card>
        </div>
    );
}
