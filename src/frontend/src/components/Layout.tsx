import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth, useProfile } from "../hooks/use-auth";
import { Role } from "../types";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const USER_NAV: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    to: "/activities/new",
    label: "Log Activity",
    icon: <Activity className="w-4 h-4" />,
  },
  {
    to: "/retro",
    label: "Retro Capture",
    icon: <MessageSquare className="w-4 h-4" />,
  },
  {
    to: "/programs",
    label: "Programs",
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    to: "/experiments",
    label: "Experiments",
    icon: <FlaskConical className="w-4 h-4" />,
  },
  { to: "/reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" /> },
];

const ADMIN_NAV: NavItem[] = [
  {
    to: "/admin",
    label: "Admin Dashboard",
    icon: <Shield className="w-4 h-4" />,
  },
  {
    to: "/admin/activities",
    label: "Activities Queue",
    icon: <ClipboardList className="w-4 h-4" />,
  },
  {
    to: "/admin/enrollments",
    label: "Enrollments",
    icon: <Users className="w-4 h-4" />,
  },
  {
    to: "/admin/reports",
    label: "Reports",
    icon: <BarChart3 className="w-4 h-4" />,
  },
];

function truncatePrincipal(p: string | null): string {
  if (!p) return "";
  if (p.length <= 20) return p;
  return `${p.slice(0, 10)}...${p.slice(-4)}`;
}

interface SidebarLinkProps {
  item: NavItem;
  collapsed: boolean;
  currentPath: string;
}

function SidebarLink({ item, collapsed, currentPath }: SidebarLinkProps) {
  const isActive =
    currentPath === item.to || currentPath.startsWith(`${item.to}/`);
  return (
    <Link
      to={item.to}
      data-ocid={`nav.${item.label.toLowerCase().replace(/\s+/g, "_")}.link`}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-smooth",
        isActive
          ? "bg-primary/15 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
        collapsed && "justify-center px-2",
      )}
      title={collapsed ? item.label : undefined}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, principal, login, logout, isLoading } = useAuth();
  const { data: profile } = useProfile();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isAdmin = profile?.role === Role.admin;
  const navItems = isAdmin ? ADMIN_NAV : USER_NAV;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar transition-smooth",
          "lg:relative lg:z-auto lg:translate-x-0",
          sidebarCollapsed ? "w-[60px]" : "w-[220px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center border-b border-border px-3 h-14 shrink-0",
            sidebarCollapsed ? "justify-center" : "justify-between gap-2",
          )}
        >
          {!sidebarCollapsed && (
            <Link to="/dashboard" className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                <span className="font-score text-xs font-bold text-primary">
                  Q
                </span>
              </div>
              <span className="font-score text-sm font-semibold text-foreground truncate">
                QRE Agent
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              setSidebarCollapsed((c) => !c);
              setMobileOpen(false);
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-smooth shrink-0"
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            data-ocid="nav.sidebar_toggle"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              collapsed={sidebarCollapsed}
              currentPath={currentPath}
            />
          ))}
          {isAuthenticated && isAdmin && (
            <>
              <div className="my-3 border-t border-border" />
              {USER_NAV.map((item) => (
                <SidebarLink
                  key={item.to}
                  item={item}
                  collapsed={sidebarCollapsed}
                  currentPath={currentPath}
                />
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-2 py-3 shrink-0">
          {isAuthenticated && principal ? (
            <div
              className={cn(
                "flex flex-col gap-2",
                sidebarCollapsed && "items-center",
              )}
            >
              {!sidebarCollapsed && (
                <div className="px-1">
                  <p className="text-xs text-muted-foreground">Principal</p>
                  <p className="font-score text-xs text-foreground truncate">
                    {truncatePrincipal(principal)}
                  </p>
                  {isAdmin && (
                    <span className="mt-0.5 inline-block text-xs font-score font-semibold text-primary">
                      ADMIN
                    </span>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => logout()}
                data-ocid="nav.logout_button"
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-smooth w-full",
                  sidebarCollapsed && "justify-center px-2",
                )}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Sign out</span>}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => login()}
              disabled={isLoading}
              data-ocid="nav.login_button"
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-xs text-primary hover:bg-primary/10 transition-smooth w-full",
                sidebarCollapsed && "justify-center px-2",
              )}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && (
                <span>{isLoading ? "Loading..." : "Sign in with II"}</span>
              )}
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card shrink-0 shadow-subtle">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
              data-ocid="nav.mobile_menu_toggle"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <span className="font-score text-xs font-medium text-muted-foreground tracking-wide uppercase">
              QRE-Agent Platform
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="font-score text-xs text-muted-foreground">
                  {truncatePrincipal(principal)}
                </span>
                {isAdmin && (
                  <span className="text-xs font-score font-bold text-primary px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10">
                    ADMIN
                  </span>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}
