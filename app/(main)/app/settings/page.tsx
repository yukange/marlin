"use client";

import { AutomationList } from "@/components/settings/automation-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-medium">General Settings</h3>
            <p className="text-sm text-muted-foreground">
              General settings will be added here.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="automation" className="space-y-4">
          <AutomationList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
