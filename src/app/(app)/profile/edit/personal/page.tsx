import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PersonalInfoPage() {
    return (
        <div className="container mx-auto max-w-3xl p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Kişisel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Bu sayfada kişisel bilgilerinizi düzenleyebilirsiniz.</p>
                </CardContent>
            </Card>
        </div>
    );
}
