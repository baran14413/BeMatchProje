import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationSettingsPage() {
    return (
        <div className="container mx-auto max-w-3xl p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Bildirim Ayarları</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Bu sayfada bildirim ayarlarınızı düzenleyebilirsiniz.</p>
                </CardContent>
            </Card>
        </div>
    );
}
