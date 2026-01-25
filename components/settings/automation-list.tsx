"use client";

import { Loader2, Plus, Bot } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { octokit, createOrUpdateFile } from "@/lib/client/github-api";
import { getUserProfile } from "@/lib/services/auth-service";
import { REPO_NAME } from "@/lib/services/repo-service";
import { SUMMARY_SCRIPT_CONTENT } from "@/lib/templates/summary-script";
import { getWorkflowYaml } from "@/lib/templates/summary-workflow";

import { AutomationDialog } from "./automation-dialog";

interface Workflow {
  name: string;
  path: string;
  id: number | string;
  state: string;
}

export function AutomationList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [repoOwner, setRepoOwner] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const user = await getUserProfile();
        setRepoOwner(user.login);
      } catch (error) {
        console.error("Failed to load user profile", error);
      }
    }
    init();
  }, []);

  const loadWorkflows = useCallback(async () => {
    if (!repoOwner) {
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: repoOwner,
        repo: REPO_NAME,
        path: ".github/workflows",
      });

      if (Array.isArray(data)) {
        const workflows = data
          .filter(
            (file) => file.name.endsWith(".yml") || file.name.endsWith(".yaml")
          )
          .filter((file) => file.name.startsWith("marlin-summary"))
          .map((file) => ({
            name: file.name
              .replace("marlin-summary-", "")
              .replace(".yml", "")
              .replace(".yaml", ""),
            path: file.path,
            id: file.sha,
            state: "active",
          }));
        setWorkflows(workflows as Workflow[]);
      }
    } catch (error) {
      console.warn("Failed to load workflows or directory empty", error);
      setWorkflows([]);
    } finally {
      setIsLoading(false);
    }
  }, [repoOwner]);

  useEffect(() => {
    if (repoOwner) {
      loadWorkflows();
    }
  }, [repoOwner, loadWorkflows]);

  const handleSave = async ({
    name,
    frequency,
    tags,
  }: {
    name: string;
    frequency: "daily" | "weekly";
    tags: string[];
  }) => {
    if (!repoOwner) {
      return;
    }

    const toastId = toast.loading("Creating automation...");

    try {
      // 1. Get API Key
      const keyRes = await fetch("/api/ai/key", { method: "POST" });
      if (!keyRes.ok) {
        throw new Error("Failed to generate AI key");
      }
      await keyRes.json();

      // 2. Upload script
      await createOrUpdateFile(
        repoOwner,
        REPO_NAME,
        ".github/scripts/marlin-summarize.mjs",
        SUMMARY_SCRIPT_CONTENT,
        "chore: update summary script"
      );

      // 3. Create Workflow
      const cron = frequency === "daily" ? "0 0 * * *" : "0 0 * * 0";
      const period = frequency === "daily" ? "day" : "week";
      const uuid = crypto.randomUUID();
      const workflowContent = getWorkflowYaml(
        cron,
        ".github/scripts/marlin-summarize.mjs",
        window.location.origin,
        tags,
        period
      );

      const workflowFilename = `marlin-summary-${uuid}.yml`;
      await createOrUpdateFile(
        repoOwner,
        REPO_NAME,
        `.github/workflows/${workflowFilename}`,
        workflowContent,
        `chore: add automation ${name}`
      );

      toast.success("Automation created successfully", { id: toastId });
      loadWorkflows();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create automation", { id: toastId });
    }
  };

  if (!repoOwner) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Automations</h3>
          <p className="text-sm text-muted-foreground">
            Manage your AI workflows.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Automation
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 opacity-50" />
            <p>No automations found.</p>
            <Button variant="link" onClick={() => setIsDialogOpen(true)}>
              Create one now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <CardTitle className="text-base truncate">
                  {workflow.name}
                </CardTitle>
                <CardDescription className="font-mono text-xs">
                  {workflow.path}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <AutomationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
      />
    </div>
  );
}
