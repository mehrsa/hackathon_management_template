import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useSitePageContext } from '@/hooks/useSitePageContext';
import { fetchProjectSubmissions } from '@/services/projectSubmissions';
import {
  splitCommaSeparatedValues,
  type ProjectSubmissionRecord,
} from '@/types/projectSubmission';

function matchesSearch(project: ProjectSubmissionRecord, query: string): boolean {
  const haystack = [
    project.projectTitle,
    project.appTheme,
    project.submitterName,
    project.teamMembers,
    project.teamEmails,
    project.teamRoles,
  ]
    .join('\n')
    .toLowerCase();

  return haystack.includes(query);
}

export function ProjectsPage() {
  const { auth, siteData } = useSitePageContext();
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState<ProjectSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchProjectSubmissions()
      .then((rows) => {
        if (!cancelled) {
          setProjects(rows);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Unable to load submitted projects.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return projects;
    }

    return projects.filter((project) => matchesSearch(project, normalized));
  }, [projects, search]);

  const moveCarousel = useCallback((direction: 'previous' | 'next') => {
    const container = carouselRef.current;

    if (!container) {
      return;
    }

    const firstCard = container.querySelector<HTMLElement>('[data-project-card]');
    const cardWidth = firstCard?.getBoundingClientRect().width ?? 0;
    const distance = Math.max(cardWidth + 24, container.clientWidth * 0.85, 280);
    const delta = direction === 'next' ? distance : -distance;

    if (typeof container.scrollBy === 'function') {
      container.scrollBy({ left: delta, behavior: 'smooth' });
      return;
    }

    container.scrollLeft += delta;
  }, []);

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[2rem] px-8 py-7 md:px-10 md:py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
          {siteData.settings.navProjectsLabel}
        </p>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl lg:text-[2.7rem]">
          Explore submitted project ideas
        </h1>
        <p className="mt-4 max-w-3xl text-[1.02rem] leading-8 text-slate-700">
          Every signed-in participant can search proposed projects, see who is on
          each team, and move through the available ideas in a carousel-style list
          to find collaborators faster.
        </p>
        <Link
          to="/register"
          className="mt-6 inline-flex rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/15 transition hover:bg-blue-700"
        >
          Open the Registration Portal
        </Link>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="glass-panel rounded-3xl px-6 py-8 text-sm text-slate-600">
          Loading submitted projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel rounded-3xl px-6 py-8 text-sm text-slate-600">
          No project proposals have been submitted yet.
        </div>
      ) : (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <label className="block w-full max-w-2xl">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Search proposed projects
                </span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, theme, team member, email, or role"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                  {filteredProjects.length} result{filteredProjects.length === 1 ? '' : 's'}
                </span>
                {filteredProjects.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => moveCarousel('previous')}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCarousel('next')}
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                    >
                      Next
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </section>

          {filteredProjects.length === 0 ? (
            <div className="glass-panel rounded-3xl px-6 py-8 text-sm text-slate-600">
              No proposed projects match your current search.
            </div>
          ) : (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-600">
                  Use the buttons or swipe horizontally to browse every proposed project.
                </p>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-800">
                  Carousel view
                </span>
              </div>
              <div
                ref={carouselRef}
                aria-label="Available proposed projects"
                className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 pr-2 scroll-smooth"
              >
                {filteredProjects.map((project) => {
                  const teamMembers = splitCommaSeparatedValues(project.teamMembers);
                  const teamEmails = splitCommaSeparatedValues(project.teamEmails);
                  const isCurrentUsers = project.ownerUserId === auth.user?.id;

                  return (
                    <article
                      key={project.id}
                      data-project-card={true}
                      className="site-card min-w-[86%] snap-start rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm sm:min-w-[32rem] xl:min-w-[26rem]"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-semibold text-slate-950">
                          {project.projectTitle}
                        </h2>
                        {isCurrentUsers ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
                            Your submission
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm font-medium text-blue-700">{project.appTheme}</p>

                      <div className="mt-5 space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Team members
                          </h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {teamMembers.map((member) => (
                              <span
                                key={`${project.id}-${member}`}
                                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                              >
                                {member}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Contact emails
                          </h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {teamEmails.map((email) => (
                              <a
                                key={`${project.id}-${email}`}
                                href={`mailto:${email}`}
                                className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700 transition hover:bg-blue-100"
                              >
                                {email}
                              </a>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Roles
                          </h3>
                          <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                            {project.teamRoles}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500">
                        <span>Submitted by {project.submitterName}</span>
                        <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
