"use client";

import { Loader2, Plus, Bot, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import YAML from "yaml";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  octokit,
  createOrUpdateFile,
  fetchBlobs,
  deleteFile,
} from "@/lib/client/github-api";
import { getUserProfile } from "@/lib/services/auth-service";
import { REPO_NAME } from "@/lib/services/repo-service";
import { SUMMARY_SCRIPT_CONTENT } from "@/lib/templates/summary-script";
import { getWorkflowYaml } from "@/lib/templates/summary-workflow";

import { AutomationDialog } from "./automation-dialog";

interface Workflow {
  name: string;
  path: string;
  id: string;
  sha: string;
  state: string;
  frequency: string;
  tags: string[];
  cron: string;
}

export function AutomationList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
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
        const workflowFiles = data
          .filter(
            (file) => file.name.endsWith(".yml") || file.name.endsWith(".yaml")
          )
          .filter((file) => file.name.startsWith("marlin-summary"));

        if (workflowFiles.length === 0) {
          setWorkflows([]);
          return;
        }

        const shas = workflowFiles.map((f) => f.sha);
        const contentsMap = await fetchBlobs(repoOwner, REPO_NAME, shas);

        const workflowsData = workflowFiles.map((file) => {
          const content = contentsMap[file.sha] || "";
          let name = file.name;
          let cron = "";
          let tags: string[] = [];

          try {
            const parsed = YAML.parse(content);
            if (parsed) {
              name = parsed.name || file.name;
              cron = parsed.on?.schedule?.[0]?.cron || "";
              const tagsStr = parsed.env?.MARLIN_TAGS;
              if (tagsStr) {
                tags = tagsStr.split(",").filter(Boolean);
              } else {
                // Fallback for legacy files via regex (optional, can remove if all migrated)
                const tagsMatch = content.match(/--tags "([^"]*)"/);
                if (tagsMatch) {
                  tags = tagsMatch[1].split(",").filter(Boolean);
                }
              }
            }
          } catch (e) {
            console.warn("Failed to parse workflow YAML:", e);
          }

          let frequency = "Custom";
          if (cron === "0 0 * * *") {
            frequency = "Daily";
          } else if (cron === "0 0 * * 0") {
            frequency = "Weekly";
          }

          return {
            name,
            path: file.path,
            id: file.sha,
            sha: file.sha,
            state: "active",
            frequency,
            tags,
            cron,
          };
        });

        setWorkflows(workflowsData as Workflow[]);
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

    const toastId = toast.loading(
      editingWorkflow ? "Updating automation..." : "Creating automation..."
    );

    try {
      // 1. Get API Key
      const keyRes = await fetch("/api/ai/key", {
        method: "POST",
        body: JSON.stringify({ owner: repoOwner, repo: REPO_NAME }),
      });
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

      let workflowFilename: string;
      if (editingWorkflow) {
        workflowFilename = editingWorkflow.path.replace(
          ".github/workflows/",
          ""
        );
      } else {
        const uuid = crypto.randomUUID();
        workflowFilename = `marlin-summary-${uuid}.yml`;
      }

      const workflowContent = getWorkflowYaml(
        name,
        cron,
        ".github/scripts/marlin-summarize.mjs",
        window.location.origin,
        tags,
        period
      );

      await createOrUpdateFile(
        repoOwner,
        REPO_NAME,
        `.github/workflows/${workflowFilename}`,
        workflowContent,
        `chore: ${editingWorkflow ? "update" : "add"} automation ${name}`
      );

      toast.success(
        `Automation ${editingWorkflow ? "updated" : "created"} successfully`,
        { id: toastId }
      );
      loadWorkflows();
    } catch (error) {
      console.error(error);
      toast.error(
        `Failed to ${editingWorkflow ? "update" : "create"} automation`,
        { id: toastId }
      );
    }
  };

  const handleDelete = async (workflow: Workflow) => {
    if (!repoOwner) {
      return;
    }
    if (!confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
      return;
    }

    const toastId = toast.loading("Deleting automation...");
    try {
      await deleteFile(
        repoOwner,
        REPO_NAME,
        workflow.path,
        `chore: delete automation ${workflow.name}`
      );
      toast.success("Automation deleted", { id: toastId });
      loadWorkflows();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete automation", { id: toastId });
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
        <Button
          onClick={() => {
            setEditingWorkflow(null);
            setIsDialogOpen(true);
          }}
        >
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
            <Button
              variant="link"
              onClick={() => {
                setEditingWorkflow(null);
                setIsDialogOpen(true);
              }}
            >
              Create one now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="group">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium">
                    {workflow.name}
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-normal">
                      {workflow.frequency}
                    </Badge>
                    {workflow.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="font-normal text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a
                      href={`https://github.com/${repoOwner}/${REPO_NAME}/blob/main/${workflow.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingWorkflow(workflow);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(workflow)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <AutomationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
        initialValues={
          editingWorkflow
            ? {
                name: editingWorkflow.name,
                frequency:
                  editingWorkflow.frequency === "Weekly" ? "weekly" : "daily",
                tags: editingWorkflow.tags,
              }
            : undefined
        }
      />
    </div>
  );
}
