import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManagePhotosPage() {
    return (
        <div className="container mx-auto max-w-3xl p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Fotoğrafları Yönet</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Bu sayfada fotoğraflarınızı yönetebilirsiniz.</p>
                </CardContent>
            </Card>
        </div>
    );
}
