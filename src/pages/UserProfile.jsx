import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageFrame from "../layout/containers/PageFrame";
import Button from "../components/Button";
import DataTable from "../components/DataTable";
import { useAuth } from "../context/AuthContext";
import dataService from "../services/dataService";
import { getJoinRequestsByUserId } from "../services/joinRequestService";
import { authService } from "../services/authService";

const UserProfile = ({ trees: initialTrees = [], currentUser: propUser }) => {
  const navigate = useNavigate();
  const { treeId } = useParams();
  const { currentUser } = useAuth();

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const data = await authService.getCurrentUserData();
      setUserData(data);
    }
    loadUser();
  }, []);

  const uid = currentUser?.uid ?? propUser?.uid ?? null;

  const [joinRequests, setJoinRequests] = useState([]);
  const [trees, setTrees] = useState(initialTrees);

  useEffect(() => {
    const loadTrees = async () => {
      if (!uid) return;
      const fetchedTrees = await dataService.getTreesByUserId(uid);
      setTrees(fetchedTrees);
    };

    loadTrees();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const load = async () => {
      try {
        const data = await getJoinRequestsByUserId(uid);
        setJoinRequests(data || []);
      } catch (err) {
        console.error("Failed to load join requests", err);
      }
    };

    load();
  }, [uid]);

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-200">
            Full Access
          </span>
        );
      case "moderator":
        return (
          <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/50 px-2.5 py-0.5 text-xs font-semibold text-purple-800 dark:text-purple-200">
            Edit Access
          </span>
        );
      case "editor":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/50 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:text-green-200">
            Edit Access
          </span>
        );
      case "viewer":
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
            View Only
          </span>
        );
      default:
        return <span>Unknown</span>;
    }
  };

  const getStatusBadge = (tree) => {
    if (tree.deletedAt) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
          Deleted
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/50 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:text-green-200">
        Active
      </span>
    );
  };

  const myFamilyTreesRows = trees.map((tree) => {
    const member = tree.members?.find((m) => m.userId === uid);
    const role = member?.role ?? "viewer";

    return {
      treeName: tree.familyName ?? "Untitled",
      role: role.charAt(0).toUpperCase() + role.slice(1),
      permissions: getRoleBadge(role),
      status: getStatusBadge(tree),
    };
  });

  const joinStats = useMemo(() => {
    const submitted = joinRequests.length;
    const accepted = joinRequests.filter((r) => r.status === "approved").length;
    const rejected = joinRequests.filter((r) => r.status === "rejected").length;
    const pending = joinRequests.filter((r) => r.status === "pending").length;

    return { submitted, accepted, rejected, pending };
  }, [joinRequests]);

  return (
    <PageFrame>
      {/* Back Button */}
      <Button
        onClick={() => navigate(-1)}
        variant="secondary"
        size="sm"
        style={{ position: "absolute", left: 16, top: 16, zIndex: 10 }}
      >
        &#8592; Back
      </Button>
      <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark group/design-root overflow-x-hidden overflow-y-auto font-display">
        <div className="layout-container flex h-full grow flex-col">
          <div className="flex flex-1 justify-center py-5 md:px-10 lg:px-20 xl:px-40">
            <div className="layout-content-container flex flex-col w-full max-w-[960px] flex-1">
              <main className="flex flex-col gap-8 p-4 sm:p-6">
                {/* Profile Title Section */}
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="flex min-w-72 flex-col gap-3">
                    <p className="text-text-light dark:text-text-dark text-4xl font-black leading-tight tracking-[-0.033em]">
                      My Profile
                    </p>
                    <p className="text-subtext-light dark:text-subtext-dark text-base font-normal leading-normal">
                      Manage your profile information and view your activity.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    className="min-w-[84px] max-w-[480px] h-10 px-4"
                  >
                    <span className="truncate">View All Trees</span>
                  </Button>
                </div>

                {/* User Info Card */}
                <div className="flex p-4 bg-card-light dark:bg-card-dark rounded-xl @container border border-border-light dark:border-border-dark">
                  <div className="flex w-full flex-col gap-4 @[520px]:flex-row @[520px]:justify-between @[520px]:items-center">
                    <div className="flex gap-4">
                      <div
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-24 w-24 min-w-24 sm:h-32 sm:w-32"
                        data-alt={`User profile avatar of ${
                          userData?.displayName || "User"
                        }`}
                        style={{
                          backgroundImage: `url("${userData?.profilePhoto}" || "/Images/default_user.png")`,
                        }}
                      ></div>
                      <div className="flex flex-col justify-center">
                        <p className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em]">
                          {userData?.displayName || "Unknown User"}
                        </p>
                        <p className="text-subtext-light dark:text-subtext-dark text-base font-normal leading-normal">
                          {userData?.email || "No email available"}
                        </p>
                        <p className="text-subtext-light dark:text-subtext-dark text-sm font-normal leading-normal">
                          Member Since:{" "}
                          {userData?.createdAt
                            ? new Date(userData.createdAt).toLocaleDateString()
                            : "Unknown"}
                        </p>
                        <p className="text-subtext-light dark:text-subtext-dark text-sm font-normal leading-normal">
                          Last Login:{" "}
                          {userData?.lastLogin
                            ? new Date(userData.lastLogin).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="flex w-full max-w-[480px] gap-3 @[480px]:w-auto">
                      <Button
                        variant="secondary"
                        size="md"
                        className="min-w-[84px] max-w-[480px] h-10 px-4 flex-1 @[480px]:flex-auto"
                      >
                        <span className="truncate">Update Photo</span>
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        className="min-w-[84px] max-w-[480px] h-10 px-4 flex-1 @[480px]:flex-auto"
                      >
                        <span className="truncate">Account Settings</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* My Family Trees Table */}
                <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] px-4">
                  My Family Trees
                </h2>
                <DataTable
                  columns={[
                    { key: "treeName", header: "Tree Name" },
                    { key: "role", header: "Role" },
                    { key: "permissions", header: "Permissions" },
                    { key: "status", header: "Status" },
                  ]}
                  data={myFamilyTreesRows}
                  enableSearch={false}
                  enableSort={false}
                  enableFilters={false}
                  enablePagination={false}
                />

                {/* Permission Matrix Table */}

                <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] px-4">
                  Permission Matrix
                </h2>

                <DataTable
                  columns={[
                    { key: "action", header: "Action" },
                    { key: "admin", header: "Admin", cellClass: "text-center" },
                    {
                      key: "moderator",
                      header: "Moderator",
                      cellClass: "text-center",
                    },
                    {
                      key: "editor",
                      header: "Editor",
                      cellClass: "text-center",
                    },
                    {
                      key: "viewer",
                      header: "Viewer",
                      cellClass: "text-center",
                    },
                  ]}
                  data={[
                    {
                      action: <span className="font-semibold">Add people</span>,
                      admin: (
                        <>
                          <span className="text-green-600 dark:text-green-400">
                            ✔
                          </span>{" "}
                          anywhere
                        </>
                      ),
                      moderator: (
                        <>
                          <span className="text-green-600 dark:text-green-400">
                            ✔
                          </span>{" "}
                          anywhere
                        </>
                      ),
                      editor: (
                        <>
                          <span className="text-green-600 dark:text-green-400">
                            ✔
                          </span>{" "}
                          own lineage only
                        </>
                      ),
                      viewer: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                    },
                    {
                      action: (
                        <span className="font-semibold">Edit people</span>
                      ),
                      admin: (
                        <>
                          <span className="text-green-600 dark:text-green-400">
                            ✔
                          </span>{" "}
                          anywhere
                        </>
                      ),
                      moderator: (
                        <>
                          <span className="text-green-600 dark:text-green-400">
                            ✔
                          </span>{" "}
                          anywhere
                        </>
                      ),
                      editor: (
                        <>
                          <span className="text-green-600 dark:text-green-400">
                            ✔
                          </span>{" "}
                          own lineage
                        </>
                      ),
                      viewer: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                    },
                    {
                      action: (
                        <span className="font-semibold">Add marriage</span>
                      ),
                      admin: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      moderator: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      editor: (
                        <>
                          <span className="text-green-600 dark:text-green-400">
                            ✔
                          </span>{" "}
                          only for themselves + descendants
                        </>
                      ),
                      viewer: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                    },
                    {
                      action: (
                        <span className="font-semibold">Delete marriage</span>
                      ),
                      admin: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      moderator: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      editor: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                      viewer: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                    },
                    {
                      action: (
                        <span className="font-semibold">
                          Add story/image/event
                        </span>
                      ),
                      admin: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      moderator: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      editor: (
                        <>
                          <span className="text-green-600 dark:text-green-400">
                            ✔
                          </span>{" "}
                          descendants
                        </>
                      ),
                      viewer: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                    },
                    {
                      action: (
                        <span className="font-semibold">
                          Delete story/image/event
                        </span>
                      ),
                      admin: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      moderator: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      editor: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                      viewer: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                    },
                    {
                      action: (
                        <span className="font-semibold">Soft delete</span>
                      ),
                      admin: (
                        <>
                          <span className="text-green-600 dark:text-green-400">
                            ✔
                          </span>{" "}
                          anyone
                        </>
                      ),
                      moderator: (
                        <>
                          <span className="text-green-600 dark:text-green-400">
                            ✔
                          </span>{" "}
                          non-root
                        </>
                      ),
                      editor: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                      viewer: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                    },
                    {
                      action: (
                        <span className="font-semibold">
                          Restore soft delete
                        </span>
                      ),
                      admin: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      moderator: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      editor: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                      viewer: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                    },
                    {
                      action: (
                        <span className="font-semibold">Cascade delete</span>
                      ),
                      admin: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      moderator: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                      editor: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                      viewer: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                    },
                    {
                      action: (
                        <span className="font-semibold">
                          Restore cascade delete
                        </span>
                      ),
                      admin: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      moderator: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                      editor: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                      viewer: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                    },
                    {
                      action: (
                        <span className="font-semibold">Manage privacy</span>
                      ),
                      admin: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      moderator: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      editor: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                      viewer: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                    },
                    {
                      action: (
                        <span className="font-semibold">
                          Manage placeholders
                        </span>
                      ),
                      admin: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      moderator: (
                        <span className="text-green-600 dark:text-green-400">
                          ✔
                        </span>
                      ),
                      editor: (
                        <>
                          <span className="text-green-600 dark:text-green-400">
                            ✔
                          </span>{" "}
                          own lineage
                        </>
                      ),
                      viewer: (
                        <span className="text-red-600 dark:text-red-400">
                          ❌
                        </span>
                      ),
                    },
                  ]}
                  enableSearch={false}
                  enableSort={false}
                  enableFilters={false}
                  enablePagination={false}
                />

                {/* Requests Overview Table */}
                <div className="flex flex-col gap-4">
                  <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold leading-tight tracking-[-0.015em] px-4">
                    Requests Overview
                  </h2>

                  <DataTable
                    columns={[
                      { key: "type", header: "Request Type" },
                      {
                        key: "submitted",
                        header: "Submitted",
                        cellClass: "text-center",
                      },
                      {
                        key: "accepted",
                        header: "Accepted",
                        cellClass: "text-center",
                      },
                      {
                        key: "rejected",
                        header: "Rejected",
                        cellClass: "text-center",
                      },
                      {
                        key: "pending",
                        header: "Pending",
                        cellClass: "text-center",
                      },
                    ]}
                    data={[
                      {
                        type: (
                          <span className="font-semibold">Join Requests</span>
                        ),
                        submitted: <span>{joinStats.submitted}</span>,
                        accepted: <span>{joinStats.accepted}</span>,
                        rejected: <span>{joinStats.rejected}</span>,
                        pending: <span>{joinStats.pending}</span>,
                      },
                      {
                        type: (
                          <span className="font-semibold">
                            Role Change Requests
                          </span>
                        ),
                        submitted: <span>0</span>,
                        accepted: <span>0</span>,
                        rejected: <span>0</span>,
                        pending: <span>0</span>,
                      },
                      {
                        type: (
                          <span className="font-semibold">
                            Edit Confirmation Requests
                          </span>
                        ),
                        submitted: <span>0</span>,
                        accepted: <span>0</span>,
                        rejected: <span>0</span>,
                        pending: <span>0</span>,
                      },
                      {
                        type: (
                          <span className="font-semibold">Other Requests</span>
                        ),
                        submitted: <span>0</span>,
                        accepted: <span>0</span>,
                        rejected: <span>0</span>,
                        pending: <span>0</span>,
                      },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <h2 className="text-text-light dark:text-text-dark text-[22px] font-bold px-4">
                    My Requests
                  </h2>

                  <DataTable
                    columns={[
                      { key: "name", header: "Name" },
                      { key: "tree", header: "Tree" },
                      {
                        key: "status",
                        header: "Status",
                        cellClass: "text-center",
                      },
                      {
                        key: "date",
                        header: "Submitted",
                        cellClass: "text-center",
                      },
                    ]}
                    data={joinRequests.map((req) => ({
                      name: req?.name ?? "—",
                      tree: req?.treeId ?? "Unknown tree",
                      status: (
                        <span
                          className={
                            req.status === "approved"
                              ? "text-green-600"
                              : req.status === "rejected"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }
                        >
                          {req.status}
                        </span>
                      ),
                      date: new Date(
                        req.submittedAt || req.createdAt
                      ).toLocaleDateString(),
                    }))}
                    enablePagination={true}
                  />
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </PageFrame>
  );
};

export default UserProfile;
