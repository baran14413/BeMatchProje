import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityPage() {
    return (
        <div className="container mx-auto max-w-3xl p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Şifre ve Güvenlik</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Bu sayfada şifre ve güvenlik ayarlarınızı düzenleyebilirsiniz.</p>
                </CardContent>
            </Card>
        </div>
    );
}
