import { data, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ClassificationReviewManager } from "~/components/features/settings/ClassificationReviewManager";
import { requireAdminSession } from "~/lib/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { token } = await requireAdminSession(request);
  return data({ token });
}

export default function AdminCategoryReviewsPage() {
  const { token } = useLoaderData<typeof loader>();

  return (
    <section aria-label="Revisões de classificação">
      <ClassificationReviewManager token={token} />
    </section>
  );
}
