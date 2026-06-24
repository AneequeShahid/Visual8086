org 100h


    mov cx, num    
    mov ax, 0      

square_loop:
    add ax, num    
    loop square_loop
    

    
    mov bx, ax     
    mov cx, num    
    mov ax, 0     

cube_loop:
    add ax, bx     
    loop cube_loop

   
    mov cube, ax   

   
    mov ah, 4ch
    int 21h

    num dw 6  
    cube dw ?      