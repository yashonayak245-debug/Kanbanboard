import {usestate} from  'react';
import { AppBar, Box,IconButton,Tootlip,InputBase,Avatar,Badge } from '@mui/material';
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SettingsIcon from "@mui/icons-material/Settings";
import AddIcon from "@mui/icons-material/Add";
import AppsIcon from "@mui/icons-material/Apps";
import { useNavigate } from "react-router-dom";

export default function Navbar({onMenuclick,isMobile,Sidebarwidth}) {
    const[logout,user]=UseAuth();
    const navigate=useNavigate();
    const HandleLogout=()=>{
        logout();
            navigate("/Login");
    }
    return(
        <AppBar
        position="fixed"
    )


}