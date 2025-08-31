// import Rightbar from "./rightbar/page";
import { AdminSidebar } from "./sidebar/page";
import { AdminNavbar } from "./navbar/page";
export default function AdminLayout({ main }: { main: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-50 w-full">
        <AdminNavbar />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 flex-shrink-0">
          <AdminSidebar />
        </aside>

        <main
          className="flex-1 p-6 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {main}
        </main>

        {/* <aside className="w-80 flex-shrink-0">
          <Rightbar />
        </aside> */}
      </div>
    </div>
  );
}

