import { useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"

export const Settings = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === "/settings") {
      navigate("/settings/store", { replace: true })
    }
  }, [location.pathname, navigate])

  return <Outlet />
}
