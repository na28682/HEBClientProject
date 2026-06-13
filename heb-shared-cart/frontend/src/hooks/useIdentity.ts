import { useEffect, useState } from "react";
import { setAuthHeaders } from "../api/client";

const USER_ID_KEY = "heb_user_id";
const USER_NAME_KEY = "heb_user_name";

export interface Identity {
  userId: string;
  userName: string;
  setUserName: (name: string) => void;
}

export function useIdentity(): Identity {
  const [userId] = useState<string>(() => {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  });

  const [userName, setUserNameState] = useState<string>(() => {
    return localStorage.getItem(USER_NAME_KEY) || "Shopper";
  });

  useEffect(() => {
    setAuthHeaders(userId, userName);
  }, [userId, userName]);

  const setUserName = (name: string) => {
    localStorage.setItem(USER_NAME_KEY, name);
    setUserNameState(name);
  };

  return { userId, userName, setUserName };
}
