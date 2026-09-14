import { PipelineForm } from "@/components/PipelineForm";

export default function NewPipelinePage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-5 overflow-x-clip sm:space-y-6 2xl:max-w-4xl">
      <header className="pipeline-page-header px-0.5">
        <p className="pipeline-page-kicker">Pipeline</p>
        <h1 className="pipeline-page-title">New Pipeline</h1>
        <p className="pipeline-page-desc">
          Capture a new opportunity with clear commercial terms — designed for speed without
          sacrificing clarity.
        </p>
      </header>
      <div className="pipeline-form-card p-4 sm:p-6 md:p-8">
        <PipelineForm />
      </div>
    </div>
  );
}
