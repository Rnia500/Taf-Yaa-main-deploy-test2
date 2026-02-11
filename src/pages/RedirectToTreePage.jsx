import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dataService from "../services/dataService"; 
import { useAuth } from "../context/AuthContext";

export default function RedirectToTree() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchAndRedirect = async () => {
      try {
        if (!currentUser) {
          // If no user, go to landing page
          navigate("/", { replace: true });
          return;
        }
        
        const latestTree = await dataService.getUserLatestTree(currentUser.uid);
        if (latestTree) {
          navigate(`/family-tree/${latestTree.id}`, { replace: true });
        } else {
          navigate("/my-trees", { replace: true });
        }
      } catch (err) {
        console.error("RedirectToTree failed:", err);
        navigate("/create-tree", { replace: true });
      }
    };

    fetchAndRedirect();
  }, [navigate, currentUser]);

  return <div>Loading your family tree...</div>;
}
