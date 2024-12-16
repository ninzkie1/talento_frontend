import React, { useState, useEffect } from "react";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import axios from "../axiosClient";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CircularProgress from "@mui/material/CircularProgress"; // For processing icon
import { useStateContext } from "../context/contextprovider";
import echo from "../echo";
import Availability from "./Availability";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Booking() {
  const { user } = useStateContext();
  const [performer, setPerformer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [acceptedBookings, setAcceptedBookings] = useState([]);
  const [declinedBookings, setDeclinedBookings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformerProfile = async () => {
      if (user && user.id) {
        try {
          const response = await axios.get(`/performers/${user.id}/portfolio`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          const { portfolio } = response.data;
          setPerformer(portfolio);
        } catch (error) {
          console.error("Error fetching performer profile:", error);
          toast.error("Failed to load performer profile.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        console.error("User is not logged in or performer profile not found.");
      }
    };

    fetchPerformerProfile();
  }, [user]);

  useEffect(() => {
    const fetchPendingBookings = async () => {
      if (performer && performer.id) {
        try {
          const response = await axios.get(`/performers/${performer.id}/bookings`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setBookings(response.data.data); // Ensure the data matches the expected response structure
        } catch (error) {
          console.error("Error fetching bookings:", error);
          toast.error("Failed to load bookings.");
        }
      }
    };

    const fetchAcceptedBookings = async () => {
      if (performer && performer.id) {
        try {
          const response = await axios.get(`/performers/${performer.id}/accepted-bookings`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setAcceptedBookings(response.data.acceptedBookings);
        } catch (error) {
          console.error("Error fetching accepted bookings:", error);
          toast.error("Failed to load accepted bookings.");
        }
      }
    };

    const fetchDeclinedBookings = async () => {
      if (performer && performer.id) {
        try {
          const response = await axios.get(`/performers/${performer.id}/declined-bookings`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setDeclinedBookings(response.data.declinedBookings);
        } catch (error) {
          console.error("Error fetching declined bookings:", error);
          toast.error("Failed to load declined bookings.");
        }
      }
    };

    if (performer) {
      fetchPendingBookings();
      fetchAcceptedBookings();
      fetchDeclinedBookings();
    }
  }, [performer]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (user && user.id) {
        try {
          const response = await axios.get(`/performer-trans`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setTransactions(response.data.data);
        } catch (error) {
          console.error("Error fetching transactions:", error);
          toast.error("Failed to load transactions.");
        }
      }
    };

    fetchTransactions();
  }, [user]);

  const updateBookingStatus = async (bookingId, status) => {
    try {
      const endpoint = status === "Accepted" 
        ? `/bookings/${bookingId}/accept` 
        : `/bookings/${bookingId}/decline`;

      const response = await axios.put(endpoint, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.status === 200) {
        if (status === "Accepted") {
          setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
          const acceptedBooking = bookings.find((booking) => booking.id === bookingId);
          if (acceptedBooking) {
            setAcceptedBookings((prev) => [...prev, { ...acceptedBooking, status }]);
          }
        } else if (status === "Declined") {
          setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
          const declinedBooking = bookings.find((booking) => booking.id === bookingId);
          if (declinedBooking) {
            setDeclinedBookings((prev) => [...prev, { ...declinedBooking, status }]);
          }
        }
        toast.success(`Booking ${status.toLowerCase()} successfully!`);
      } else {
        toast.error(`Failed to ${status.toLowerCase()} booking. Please try again later.`);
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen lg:flex lg:flex-col lg:gap-6">
      <ToastContainer />

      <div className="flex-grow lg:w-full mb-6 lg:mb-0">
        <header className="mb-6">
          <Availability/>
          <h1 className="text-2xl lg:text-3xl font-bold mb-4">Booking Requests</h1>
        </header>

        {/* Booking Requests */}
        <section className="bg-white shadow-md rounded-lg p-4 lg:p-6 mb-6 overflow-x-auto">
          {bookings.filter((booking) => booking.status.toLowerCase() === "pending").length === 0 ? (
            <p>No Booking Requests Available</p>
          ) : (
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Client</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Event & Theme</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Date</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Time</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Location</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Status</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings
                  .filter((booking) => booking.status.toLowerCase() === "pending")
                  .map((booking) => (
                    <tr key={booking.id} className="border-b">
                      <td className="border px-2 py-1 lg:px-4 lg:py-2">
                        {booking.client?.name} {booking.client?.lastname}
                      </td>
                      <td className="border px-2 py-1 lg:px-4 lg:py-2">
                        {booking.event_name}, {booking.theme_name}
                      </td>
                      <td className="border px-2 py-1 lg:px-4 lg:py-2">{booking.start_date}</td>
                      <td className="border px-2 py-1 lg:px-4 lg:py-2">
                        {booking.start_time} to {booking.end_time}
                      </td>
                      <td className="border px-2 py-1 lg:px-4 lg:py-2">
                        {`${booking.municipality_name}, ${booking.barangay_name}`}
                      </td>
                      <td className="border px-2 py-1 lg:px-4 lg:py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-white text-sm ${
                            booking.status.toLowerCase() === "accepted"
                              ? "bg-green-500"
                              : booking.status.toLowerCase() === "rejected"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="border px-2 py-1 lg:px-4 lg:py-2 space-x-2 flex justify-center">
                        <Button variant="contained" color="info" onClick={() => handleViewDetails(booking)}>
                          View
                        </Button>
                        {booking.status.toLowerCase() === "pending" && (
                          <>
                            <Button
                              variant="contained"
                              color="success"
                              onClick={() => updateBookingStatus(booking.id, "Accepted")}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              onClick={() => updateBookingStatus(booking.id, "Declined")}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Accepted Bookings */}
        <section className="bg-white shadow-md rounded-lg p-4 lg:p-6 mb-6 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4">Accepted Bookings</h2>
          {acceptedBookings.length === 0 ? (
            <p>No Accepted Bookings Available</p>
          ) : (
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Client</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Event & Theme</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Date</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Time</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Location</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {acceptedBookings.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td className="border px-2 py-1 lg:px-4 lg:py-2">
                      {booking.client?.name} {booking.client?.lastname}
                    </td>
                    <td className="border px-2 py-1 lg:px-4 lg:py-2">
                      {booking.event_name}, {booking.theme_name}
                    </td>
                    <td className="border px-2 py-1 lg:px-4 lg:py-2">{booking.start_date}</td>
                    <td className="border px-2 py-1 lg:px-4 lg:py-2">
                      {booking.start_time} to {booking.end_time}
                    </td>
                    <td className="border px-2 py-1 lg:px-4 lg:py-2">
                      {`${booking.municipality_name}, ${booking.barangay_name}`}
                    </td>
                    <td
                      className={`border px-2 py-1 lg:px-4 lg:py-2 text-white ${
                        booking.status.toLowerCase() === "accepted" ? "bg-green-500" : ""
                      }`}
                    >
                      {booking.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Declined Bookings */}
        <section className="bg-white shadow-md rounded-lg p-4 lg:p-6 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4">Declined Bookings</h2>
          {declinedBookings.length === 0 ? (
            <p>No Declined Bookings Available</p>
          ) : (
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Client</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Event & Theme</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Date</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Time</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Location</th>
                  <th className="px-2 py-1 lg:px-4 lg:py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {declinedBookings.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td className="border px-2 py-1 lg:px-4 lg:py-2">
                      {booking.client?.name} {booking.client?.lastname}
                    </td>
                    <td className="border px-2 py-1 lg:px-4 lg:py-2">
                      {booking.event_name}, {booking.theme_name}
                    </td>
                    <td className="border px-2 py-1 lg:px-4 lg:py-2">{booking.start_date}</td>
                    <td className="border px-2 py-1 lg:px-4 lg:py-2">
                      {booking.start_time} to {booking.end_time}
                    </td>
                    <td className="border px-2 py-1 lg:px-4 lg:py-2">
                      {`${booking.municipality_name}, ${booking.barangay_name}`}
                    </td>
                    <td
                      className={`border px-2 py-1 lg:px-4 lg:py-2 text-white ${
                        booking.status.toLowerCase() === "declined" ? "bg-red-500" : ""
                      }`}
                    >
                      {booking.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Transactions */}
        <section className="bg-white shadow-md rounded-lg p-4 lg:p-6 mb-6 overflow-x-auto">
          <h2 className="text-xl font-semibold mb-4">Transactions</h2>
          {transactions.length === 0 ? (
            <p>No Transactions Available</p>
          ) : (
            <TableContainer component={Paper}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction Type</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date of Booking</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.transaction_type}</TableCell>
                      <TableCell>
                        {/* Conditional rendering for icons */}
                        {(transaction.transaction_type === "Booking Payment" ||
                          (transaction.transaction_type === "Booking Accepted" &&
                            transaction.status === "PROCESSING") ||
                          (transaction.transaction_type === "Waiting for Approval" &&
                            transaction.status === "PENDING")) && (
                          <CircularProgress size={16} style={{ marginRight: 8 }} />
                        )}
                        {transaction.transaction_type === "Waiting for Approval" &&
                          transaction.status === "APPROVED" && (
                            <span style={{ color: "#22C55E", marginRight: 8 }}>+</span>
                          )}
                        ₱{parseFloat(transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {dayjs(transaction.start_date).isValid()
                          ? dayjs(transaction.start_date).format("MMMM D, YYYY")
                          : "Invalid Date"}
                      </TableCell>
                      <TableCell>
                        <span
                          style={{
                            backgroundColor:
                              transaction.status === "PENDING"
                                ? "#FBBF24"
                                : transaction.status === "APPROVED"
                                ? "#22C55E"
                                : transaction.status === "DECLINED"
                                ? "#EF4444"
                                : "#AAAAAA",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "8px",
                            fontSize: "0.8em",
                          }}
                        >
                          {transaction.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </section>
      </div>

      {/* Dialog for Viewing Booking Details */}
      {selectedBooking && (
        <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
          <DialogTitle>{selectedBooking.event_name}</DialogTitle>
          <DialogContent>
            <p>
              <strong>Client: </strong> {selectedBooking.client?.name}{" "}
              {selectedBooking.client?.lastname}
            </p>
            <p>
              <strong>Performer: </strong> {selectedBooking.performer?.user?.name}{" "}
              {selectedBooking.performer?.user?.lastname}
            </p>
            <p>
              <strong>Date:</strong> {selectedBooking.start_date}
            </p>
            <p>
              <strong>Location:</strong>{" "}
              {`${selectedBooking.municipality_name}, ${selectedBooking.barangay_name}`}
            </p>
            <p>
              <strong>Notes:</strong> {selectedBooking.notes}
            </p>
            <p>
              <strong>Status:</strong> {selectedBooking.status}
            </p>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}
