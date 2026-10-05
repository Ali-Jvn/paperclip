import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectRepository } from "@paperclipai/shared";
import { Folder, X } from "lucide-react";
import { useDialog } from "../context/DialogContext";
import { useCompany } from "../context/CompanyContext";
import { projectsApi } from "../api/projects";
import { queryKeys } from "../lib/queryKeys";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { ProjectRepositoryInput, repositoryOptionsKey } from "./ProjectRepositoryInput";
import { ChoosePathButton } from "./PathInstructionsModal";
import { ConnectionSetupFlow } from "@/features/connections/ConnectionSetupFlow";
import { useManagedSandboxOnly } from "../hooks/useManagedSandboxOnly";

const isAbsolutePath = (value: string) => value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value);

const folderName = (value: string) =>
  value.replace(/[\\/]+$/, "").split(/[\\/]/).filter(Boolean).pop() ?? "Local folder";

export function NewProjectDialog() {
  const { newProjectOpen, closeNewProject } = useDialog();
  const { selectedCompanyId } = useCompany();
  return selectedCompanyId && newProjectOpen
    ? <NewProjectForm key={selectedCompanyId} companyId={selectedCompanyId} onClose={closeNewProject} /> : null;
}

export function NewProjectForm({ companyId, onClose }: { companyId: string; onClose: () => void }) {
  const client = useQueryClient();
  const [name, setName] = useState("");
  const [repos, setRepos] = useState<ProjectRepository[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [localPath, setLocalPath] = useState("");
  const { hideHostPaths } = useManagedSandboxOnly();
  const input = useRef<HTMLInputElement>(null);
  const create = useMutation({
    mutationFn: async () => {
      const cwd = hideHostPaths ? "" : localPath.trim();
      if (cwd && !isAbsolutePath(cwd)) throw new Error("Local folder must be a full absolute path.");
      const base = { name: name.trim(), status: "planned" };
      const workspace = { name: folderName(cwd), sourceType: "local_path", cwd, isPrimary: true };
      if (!cwd) return projectsApi.create(companyId, { ...base, repositoryIds: repos.map((repo) => repo.id) });
      if (!repos.length) return projectsApi.create(companyId, { ...base, workspace });
      // The create route takes either a workspace or repositoryIds, so a local
      // folder alongside repos is attached right after the project exists.
      const project = await projectsApi.create(companyId, { ...base, repositoryIds: repos.map((repo) => repo.id) });
      await projectsApi.createWorkspace(project.id, workspace, companyId);
      return project;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.projects.all(companyId) });
      onClose();
    },
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !create.isPending) onClose(); }}>
    <DialogContent showCloseButton={false} aria-describedby={undefined}
      className="flex max-h-(--sz-calc-18) flex-col gap-0 overflow-hidden p-0 shadow-sm sm:max-w-lg"
      onOpenAutoFocus={(event) => { event.preventDefault(); input.current?.focus(); }}>
      {connecting ? <div className="min-h-0 overflow-y-auto p-5">
        <DialogTitle className="sr-only">Connect GitHub</DialogTitle>
        <ConnectionSetupFlow host="dialog" serviceSlug="github" forceNewConnection onCancel={() => setConnecting(false)} onComplete={() => {
          void client.invalidateQueries({ queryKey: repositoryOptionsKey(companyId) });
          setConnecting(false);
        }} />
      </div> : <form className="flex min-h-0 flex-col overflow-hidden" onSubmit={(event) => { event.preventDefault(); if (name.trim() && !create.isPending) create.mutate(); }}>
        <div className="flex shrink-0 flex-col gap-4 px-5 pb-4 pt-5">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg font-semibold">Create project</DialogTitle>
            <Button type="button" variant="ghost" size="icon-sm" disabled={create.isPending} aria-label="Close new project" onClick={onClose}><X className="size-4" /></Button>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-input px-3 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
            <Folder className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input ref={input} aria-label="Project name" value={name} disabled={create.isPending} onChange={(event) => setName(event.target.value)} placeholder="Project name" required
              className="h-10 w-full min-w-0 border-0 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm" />
          </div>
        </div>
        <div role="region" aria-label="Source repositories" tabIndex={0} className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-1 outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring">
          <ProjectRepositoryInput companyId={companyId} selected={repos} onChange={setRepos} onConnect={() => setConnecting(true)} disabled={create.isPending} />
          {/* A host path means nothing under the managed-sandbox-only policy, so the field stays hidden until that policy is known to be off. */}
          {!hideHostPaths && <div className="flex min-w-0 flex-col gap-3 pt-4 pb-3">
            <div className="flex items-baseline gap-2"><span className="text-sm font-medium">Local folder</span><span className="text-xs text-muted-foreground">optional</span></div>
            <div className="flex items-center gap-2">
              <input aria-label="Local folder" value={localPath} disabled={create.isPending} onChange={(event) => { setLocalPath(event.target.value); create.reset(); }}
                placeholder="/absolute/path/to/workspace"
                className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 font-mono text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring" />
              <ChoosePathButton />
            </div>
            <p className="text-xs text-muted-foreground">Local agents read and write files for this project in this folder.</p>
          </div>}
        </div>
        {create.isError && <p role="alert" className="px-5 pt-3 text-sm text-destructive">{create.error.message}</p>}
        <div className="flex shrink-0 justify-end gap-2 px-5 py-5">
          <Button type="button" variant="ghost" disabled={create.isPending} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim() || create.isPending}>{create.isPending ? "Creating…" : "Create project"}</Button>
        </div>
      </form>}
    </DialogContent>
  </Dialog>;
}
