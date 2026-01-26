on run argv
    set limitCount to 10
    if (count of argv) > 0 then
        set limitCount to item 1 of argv as integer
    end if
    
    tell application "Mail"
        set unreadMessages to (every message of inbox whose read status is false)
        set msgCount to count of unreadMessages
        if msgCount is 0 then
            return "No unread messages."
        end if
        
        if msgCount < limitCount then
            set limitCount to msgCount
        end if
        
        set output to "Found " & msgCount & " unread messages. Creating summary for top " & limitCount & ":\n"
        
        repeat with i from 1 to limitCount
            set thisMsg to item i of unreadMessages
            set msgSubject to subject of thisMsg
            set msgSender to sender of thisMsg
            set msgDate to date received of thisMsg
            
            set output to output & i & ". [" & msgDate & "] From: " & msgSender & " | Subject: " & msgSubject & "\n"
        end repeat
        
        return output
    end tell
end run
