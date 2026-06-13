import { useEffect, useState } from "react";
import { getMe, updateMe } from "./api/client";
import { useIdentity } from "./hooks/useIdentity";
import Home from "./components/Home";
import ListPage from "./components/ListPage";
import NameGate from "./components/NameGate";

function getListIdFromHash(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/^#\/list\/(.+)$/);
  return match ? match[1] : null;
}

export default function App() {
  const { userId, userName, setUserName } = useIdentity();
  const [ready, setReady] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [listId, setListId] = useState<string | null>(getListIdFromHash());

  useEffect(() => {
    const onHashChange = () => setListId(getListIdFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const me = await getMe();
        if (!localStorage.getItem("heb_user_name_set")) {
          setNeedsName(true);
        } else if (me.name !== userName) {
          await updateMe(userName);
        }
      } catch {
        // ignore
      } finally {
        setReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleSetName(name: string) {
    setUserName(name);
    localStorage.setItem("heb_user_name_set", "1");
    try {
      await updateMe(name);
    } catch {
      // ignore
    }
    setNeedsName(false);
  }

  function openList(id: string) {
    window.location.hash = `#/list/${id}`;
    setListId(id);
  }

  function goHome() {
    window.location.hash = "";
    setListId(null);
  }

  if (!ready) {
    return (
      <div className="page center">
        <p className="muted">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <header className="topbar">
        <a
          className="topbar-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            goHome();
          }}
        >
          <span className="mark">H E B</span>
          Shared Cart
        </a>
        <div className="topbar-user">
          <span>{userName}</span>
          <button onClick={() => setNeedsName(true)}>Edit name</button>
        </div>
      </header>

      {needsName && <NameGate initialName={userName} onSave={handleSetName} />}

      {listId ? (
        <ListPage listId={listId} userId={userId} userName={userName} onBack={goHome} />
      ) : (
        <Home onOpenList={openList} />
      )}
    </div>
  );
}
