// src/pages/NotificationsPage.jsx
import React, { useState } from "react";
import { X } from "lucide-react";
import "../styles/NotificationsPage.css";

const NotificationsPage = () => {
  const [selected, setSelected] = useState("Tree Merge Request");

  const notifications = [
    {
      id: 1,
      type: "Tree Merge Request",
      sender: "Kwame Asante",
      message: "Kwame Asante wants to merge their family tree with yours. Common ancestor: Nana Ama Asante (1890–1965)",
      details: {
        treeId: "TR_456789",
        ancestor: "Nana Ama Asante",
        confidence: "95%",
      },
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "Family Tree Invitation",
      sender: "Jean-Baptiste Ngono",
      message: "You have been invited to join the tree.",
      time: "15:07",
    },
    {
      id: 3,
      type: "New Oral Story Added",
      sender: "Mama Fatou",
      message: "Mama Fatou uploaded an audio story.",
      time: "15:07",
    },
  ];

  const current = notifications.find((n) => n.type === selected);

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <div className="title">
          <span className="bell-icon">🔔</span>
          <div>
            <h2>Notifications</h2>
            <p>Stay updated with your family tree activities</p>
          </div>
        </div>
        <div className="actions">
          <button className="secondary">Mark all as read</button>
          <button className="secondary">2 New</button>
          <button className="secondary">3 actions</button>
          <button className="close-btn"><X size={20} /></button>
        </div>
      </div>

      {/* Content */}
      <div className="notifications-body">
        {/* Sidebar */}
        <div className="notifications-sidebar">
          <div className="sidebar-section">
            <button className="active">Inbox</button>
            <button>Archive</button>
          </div>

          <ul>
            {notifications.map((n) => (
              <li
                key={n.id}
                className={selected === n.type ? "active" : ""}
                onClick={() => setSelected(n.type)}
              >
                <strong>{n.type}</strong>
                <p>{n.sender} - {n.message.substring(0, 30)}...</p>
                <span className="time">{n.time}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Detail view */}
        <div className="notifications-detail">
          {current ? (
            <>
              <h3>{current.type}</h3>
              <p><strong>From:</strong> {current.sender}</p>
              <p>{current.message}</p>

              {current.details && (
                <div className="details">
                  <p><strong>Tree ID:</strong> {current.details.treeId}</p>
                  <p><strong>Common ancestor:</strong> {current.details.ancestor}</p>
                  <p><strong>Match confidence:</strong> {current.details.confidence}</p>
                </div>
              )}

              <div className="buttons">
                <button className="approve">Approve</button>
                <button className="reject">Reject</button>
              </div>
            </>
          ) : (
            <p>Select a notification to see details</p>
          )}
        </div>
      </div>
    </div>
  );
}
export default NotificationsPage;